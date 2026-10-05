import { classYearFromEntryYear, parseRegStudents } from './sync-reg.service';

describe('REG sync helpers', () => {
  describe('classYearFromEntryYear', () => {
    it('turns the entry year into the class year (academic year starts in June)', () => {
      const oct2026 = new Date(2026, 9, 4); // academic year 2569
      expect(classYearFromEntryYear('2567', oct2026)).toBe(3);
      expect(classYearFromEntryYear('2569', oct2026)).toBe(1);

      const mar2027 = new Date(2027, 2, 1); // still academic year 2569
      expect(classYearFromEntryYear('2567', mar2027)).toBe(3);
      const jul2027 = new Date(2027, 6, 1); // academic year 2570
      expect(classYearFromEntryYear('2567', jul2027)).toBe(4);
    });

    it('stays within 1-8', () => {
      const now = new Date(2026, 9, 4);
      expect(classYearFromEntryYear('2575', now)).toBe(1);
      expect(classYearFromEntryYear('2550', now)).toBe(8);
    });
  });

  describe('parseRegStudents', () => {
    const html = `
      <table>
        <tr><th>ลำดับ</th><th>รหัส</th><th>ชื่อ</th><th>สถานะ</th></tr>
        <tr><td>1</td><td>6704101301</td><td>นายกชณัฐพัฒน์   พลอยเกิด</td><td>ปกติ</td></tr>
        <tr><td>2</td><td><b>6704101304</b></td><td>นางสาวกฤษณา โพธา</td><td>ปกติ</td></tr>
        <tr><td>3</td><td>6704101363</td><td>นายภาณุพงษ์ เวียงห้า</td><td>ปกติ</td></tr>
        <tr><td>4</td><td>6704101363</td><td>นายภาณุพงษ์ เวียงห้า</td><td>ปกติ</td></tr>
        <tr><td>5</td><td>รวม</td><td>3 คน</td><td></td></tr>
      </table>`;

    it('reads code and name, strips honorifics and extra spaces, skips non-student rows and duplicates', () => {
      expect(parseRegStudents(html)).toEqual([
        { studentId: '6704101301', name: 'กชณัฐพัฒน์ พลอยเกิด' },
        { studentId: '6704101304', name: 'กฤษณา โพธา' },
        { studentId: '6704101363', name: 'ภาณุพงษ์ เวียงห้า' },
      ]);
    });

    it('returns nothing when the page has no table', () => {
      expect(parseRegStudents('<html>maintenance</html>')).toEqual([]);
    });
  });
});
