import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateInterestDto,
  CreateLookingForDto,
  QueryInterestsDto,
  UpdateCategoryDto,
  UpdateInterestDto,
  UpdateLookingForDto,
} from './dto/interest.dto';

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active interests (admins may ask for disabled ones too), filtered in SQL. */
  async findAll(query: QueryInterestsDto = {}, allowInactive = false) {
    const q = query.search?.trim();
    const ids = query.ids?.split(',').map((id) => id.trim()).filter(Boolean);
    const where: Prisma.InterestWhereInput = {
      ...(!(allowInactive && query.includeInactive) && { isActive: true }),
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(ids && { id: { in: ids } }),
    };
    return this.prisma.interest.findMany({ where, include: { category: true }, orderBy: { name: 'asc' } });
  }

  async findCategories() {
    return this.prisma.interestCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findCategory(id: string) {
    const category = await this.prisma.interestCategory.findUnique({ where: { id } });
    if (!category) throw AppException.notFound('Category not found');
    return category;
  }

  async findLookingForOptions() {
    return this.prisma.lookingForOption.findMany({ orderBy: { label: 'asc' } });
  }

  private validateInterestName(name: string) {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) throw AppException.badRequest('Interest name must be at least 2 characters');
    if (normalized.length > 50) throw AppException.badRequest('Interest name must be at most 50 characters');
    if (/^[^a-zA-Z0-9฀-๿]+$/.test(normalized)) {
      throw AppException.badRequest('Interest name must contain letters or numbers');
    }
    return normalized;
  }

  private async assertNameFree(nameLower: string, exceptId?: string) {
    const existing = await this.prisma.interest.findUnique({ where: { nameLower } });
    if (existing && existing.id !== exceptId) throw AppException.conflict('Interest already exists');
  }

  async adminCreateInterest(data: CreateInterestDto) {
    const name = this.validateInterestName(data.name);
    await this.assertNameFree(name.toLowerCase());
    await this.findCategory(data.categoryId);

    const interest = await this.prisma.interest.create({
      data: { name, nameLower: name.toLowerCase(), icon: data.icon?.trim() || '⭐', categoryId: data.categoryId },
    });
    return { success: true, interest };
  }

  async adminUpdateInterest(interestId: string, data: UpdateInterestDto) {
    const current = await this.prisma.interest.findUnique({ where: { id: interestId } });
    if (!current) throw AppException.notFound('Interest not found');

    const updateData: Prisma.InterestUncheckedUpdateInput = {};
    if (data.name) {
      const name = this.validateInterestName(data.name);
      await this.assertNameFree(name.toLowerCase(), interestId);
      updateData.name = name;
      updateData.nameLower = name.toLowerCase();
    }
    if (data.categoryId) {
      await this.findCategory(data.categoryId);
      updateData.categoryId = data.categoryId;
    }
    if (data.icon) updateData.icon = data.icon.trim();
    // MIS could not disable interests (its toggle was a no-op); here it is real.
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const interest = await this.prisma.interest.update({ where: { id: interestId }, data: updateData });
    return { success: true, interest };
  }

  // ── Catalog management (admin) ────────────────────────────

  private async assertCategoryNameFree(name: string, exceptId?: string) {
    const existing = await this.prisma.interestCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, ...(exceptId && { id: { not: exceptId } }) },
    });
    if (existing) throw AppException.conflict('A category with this name already exists');
  }

  async createCategory(data: CreateCategoryDto) {
    const name = data.name.trim();
    await this.assertCategoryNameFree(name);
    return this.prisma.interestCategory.create({ data: { name, icon: data.icon.trim(), color: data.color } });
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    await this.findCategory(id);
    if (data.name) await this.assertCategoryNameFree(data.name.trim(), id);
    return this.prisma.interestCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.icon && { icon: data.icon.trim() }),
        ...(data.color && { color: data.color }),
      },
    });
  }

  /** Only empty categories can be deleted - move or delete their interests first. */
  async deleteCategory(id: string) {
    await this.findCategory(id);
    const inUse = await this.prisma.interest.count({ where: { categoryId: id } });
    if (inUse > 0) {
      throw AppException.conflict(`This category still has ${inUse} interest(s) - move them to another category first`);
    }
    await this.prisma.interestCategory.delete({ where: { id } });
    return { success: true };
  }

  private async assertLabelFree(label: string, exceptId?: string) {
    const existing = await this.prisma.lookingForOption.findFirst({
      where: { label: { equals: label, mode: 'insensitive' }, ...(exceptId && { id: { not: exceptId } }) },
    });
    if (existing) throw AppException.conflict('This option already exists');
  }

  async createLookingFor(data: CreateLookingForDto) {
    const label = data.label.trim();
    await this.assertLabelFree(label);
    return this.prisma.lookingForOption.create({ data: { label, icon: data.icon.trim() } });
  }

  async updateLookingFor(id: string, data: UpdateLookingForDto) {
    const option = await this.prisma.lookingForOption.findUnique({ where: { id } });
    if (!option) throw AppException.notFound('Option not found');
    if (data.label) await this.assertLabelFree(data.label.trim(), id);
    return this.prisma.lookingForOption.update({
      where: { id },
      data: { ...(data.label && { label: data.label.trim() }), ...(data.icon && { icon: data.icon.trim() }) },
    });
  }

  /** Students who picked it lose the selection (cascade); the count is returned. */
  async deleteLookingFor(id: string) {
    const option = await this.prisma.lookingForOption.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!option) throw AppException.notFound('Option not found');
    await this.prisma.lookingForOption.delete({ where: { id } });
    return { success: true, removedFromStudents: option._count.students };
  }

  /** Categories with how many interests each has (admin page). */
  async categoriesWithCounts() {
    const cats = await this.prisma.interestCategory.findMany({
      include: { _count: { select: { interests: true } } },
      orderBy: { name: 'asc' },
    });
    return cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, interestCount: c._count.interests }));
  }

  async lookingForWithCounts() {
    const options = await this.prisma.lookingForOption.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { label: 'asc' },
    });
    return options.map((o) => ({ id: o.id, label: o.label, icon: o.icon, studentCount: o._count.students }));
  }

  async getInterestStatistics() {
    const [totalInterests, customInterests, totalStudents, studentsWithInterests, interestUsage, categoryUsage] =
      await Promise.all([
        this.prisma.interest.count(),
        this.prisma.interest.count({ where: { isCustom: true } }),
        this.prisma.student.count(),
        this.prisma.student.count({ where: { interests: { some: {} } } }),
        this.prisma.interest.findMany({
          include: { category: true, _count: { select: { students: true } } },
          orderBy: [{ students: { _count: 'desc' } }, { name: 'asc' }],
        }),
        this.prisma.interestCategory.findMany({
          include: {
            _count: { select: { interests: true } },
            interests: { include: { _count: { select: { students: true } } } },
          },
          orderBy: { name: 'asc' },
        }),
      ]);

    return {
      totalInterests,
      customInterests,
      totalStudents,
      studentsWithNoInterests: totalStudents - studentsWithInterests,
      interestUsage: interestUsage.map((i) => ({
        id: i.id,
        name: i.name,
        icon: i.icon,
        categoryId: i.categoryId,
        categoryName: i.category.name,
        categoryColor: i.category.color,
        isCustom: i.isCustom,
        isActive: i.isActive,
        studentCount: i._count.students,
      })),
      categoryStats: categoryUsage.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        interestCount: cat._count.interests,
        totalStudentUsage: cat.interests.reduce((sum, i) => sum + i._count.students, 0),
      })),
    };
  }
}
