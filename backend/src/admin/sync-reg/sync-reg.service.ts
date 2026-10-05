import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Honorifics REG prefixes to names; the app shows names without them. */
const HONORIFIC = /^(นางสาว|นาย|นาง|ด\.ช\.|ด\.ญ\.)\s*/;

/**
 * Class year (1, 2, 3...) of students admitted in `entryYear` (Buddhist era).
 * The Thai academic year starts in June: in Oct 2026 (BE 2569) the 2567
 * intake is in year 3.
 */
export function classYearFromEntryYear(entryYear: string, now = new Date()): number {
  const academicYear = now.getFullYear() + 543 - (now.getMonth() < 5 ? 1 : 0);
  return Math.min(8, Math.max(1, academicYear - parseInt(entryYear, 10) + 1));
}

/** Student code + display name for every 10-digit row of the REG print-out table. */
export function parseRegStudents(html: string): { studentId: string; name: string }[] {
  const table = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) return [];
  const students = new Map<string, string>();
  for (const row of table[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) ?? []) {
    // Same cell matching as the MIS scraper: a bare <th> also counts as a cell,
    // which keeps the column indexes (1 = code, 2 = name) aligned with REG's markup.
    const cells = row.match(/<th[^>]*>|<td[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) ?? [];
    if (cells.length < 4) continue;
    const text = (cell: string) => cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const studentId = text(cells[1]);
    const name = text(cells[2]).replace(HONORIFIC, '').trim();
    if (/^\d{10}$/.test(studentId) && name) students.set(studentId, name);
  }
  return [...students].map(([studentId, name]) => ({ studentId, name }));
}

@Injectable()
export class SyncRegService {
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 2000;

  constructor(private prisma: PrismaService) {}

  async syncStudents(entryYear: string) {
    if (!/^25\d{2}$/.test(entryYear ?? '')) {
      throw new BadRequestException('entryYear must be a Buddhist-era year such as 2567');
    }

    const now = Date.now();
    if (now - this.lastRequestTime < this.RATE_LIMIT_MS) {
      throw new BadRequestException('Rate limit exceeded. Wait a few seconds.');
    }
    this.lastRequestTime = now;

    const programId = '65304010'; 
    const url = `https://edu.mju.ac.th/www/studentListPrintOut.aspx?programid=${programId}&admitacadyear=${entryYear}`;
    
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    };

    try {
      const getRes = await fetch(url, { method: 'GET', headers: commonHeaders });
      if (!getRes.ok) throw new Error(`GET failed with status ${getRes.status}`);
      
      const html = await getRes.text();

      const faculty = 'วิทยาศาสตร์';
      const program = 'วิทยาการคอมพิวเตอร์';
      // `year` is the class year (1, 2, 3...), not the entry year the REG page is queried by.
      const year = classYearFromEntryYear(entryYear);
      const scraped = parseRegStudents(html);

      const known = await this.prisma.student.findMany({
        where: { studentId: { in: scraped.map((s) => s.studentId) } },
        select: { studentId: true, dataSource: true },
      });
      const existing = new Set(known.map((s) => s.studentId));
      // Records an admin corrected by hand are not overwritten by REG.
      const adminEdited = new Set(known.filter((s) => s.dataSource === 'ADMIN').map((s) => s.studentId));
      const toSync = scraped.filter((s) => !adminEdited.has(s.studentId));
      const skipped = scraped.length - toSync.length;

      const results = await Promise.allSettled(
        toSync.map(({ studentId, name }) =>
          this.prisma.student.upsert({
            where: { studentId },
            update: { name, faculty, program, year, dataSource: 'REG' },
            create: { studentId, name, faculty, program, year, dataSource: 'REG' },
          }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const updated = toSync.filter((s, i) => existing.has(s.studentId) && results[i].status === 'fulfilled').length;
      const inserted = toSync.length - updated - failed;

      await this.prisma.syncLog.create({
        data: {
          source: 'Maejo REG', faculty, program,
          fetched: scraped.length, inserted, updated, skipped, failed,
          status: failed ? 'PARTIAL' : 'SUCCESS'
        }
      });

      return {
        success: true,
        count: toSync.length - failed,
        skipped,
        message: `Synced ${toSync.length - failed} students (${inserted} new, ${updated} updated${skipped ? `, ${skipped} admin-edited kept` : ''}${failed ? `, ${failed} failed` : ''})`,
      };
    } catch(error: any) {
      console.error('Scraper API Error:', error);
      await this.prisma.syncLog.create({
        data: {
          source: 'Maejo REG', faculty: 'วิทยาศาสตร์', program: 'วิทยาการคอมพิวเตอร์',
          fetched: 0, inserted: 0, updated: 0, skipped: 0, failed: 1,
          status: 'FAILED'
        }
      }).catch(e => console.error('Failed to write error sync log', e));
      throw new InternalServerErrorException(error.message);
    }
  }

  async getLogs() {
    return this.prisma.syncLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  }
}
