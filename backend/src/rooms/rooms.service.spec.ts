import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/errors';
import { ReferenceDataService } from '../core-hub/reference-data.service';
import { Room } from '../core-hub/reference-data.types';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRoomsDto } from './dto/query-rooms.dto';
import { RoomsService } from './rooms.service';

const TOKEN = 'caller-token';

const room = (code: string, nameTh: string, building = 'อาคารทดสอบ'): Room => ({
  code,
  nameTh,
  building,
  buildingCode: 'TEST',
  floor: 1,
  capacity: 30,
  roomType: 'LAB',
  facultyCode: 'SCI',
  photoUrl: null,
  isActive: true,
  updatedAt: '2026-09-26T00:00:00.000Z',
});

/** A query as the ValidationPipe builds it (the class carries skip/take). */
const query = (fields: Partial<QueryRoomsDto>): QueryRoomsDto =>
  Object.assign(new QueryRoomsDto(), fields);

describe('RoomsService', () => {
  let referenceData: { list: jest.Mock; get: jest.Mock };
  let service: RoomsService;

  beforeEach(() => {
    const rooms = [room('LAB-2', 'ห้องปฏิบัติการ 2'), room('LAB-1', 'ห้องปฏิบัติการ 1'), room('LECT-6', 'ห้องบรรยาย 6')];
    referenceData = {
      list: jest.fn((_dataset: string, _token: string, predicate?: (item: Room) => boolean) =>
        Promise.resolve(predicate ? rooms.filter(predicate) : rooms),
      ),
      get: jest.fn(),
    };
    service = new RoomsService(
      {} as PrismaService,
      referenceData as unknown as ReferenceDataService,
    );
  });

  it("lists Core Hub rooms by code, paged, with the caller's token", async () => {
    const { items, total } = await service.findAll(query({ page: 1, limit: 2 }), TOKEN);

    expect(items.map((item) => item.code)).toEqual(['LAB-1', 'LAB-2']);
    expect(total).toBe(3);
    expect(referenceData.list).toHaveBeenCalledWith('rooms', TOKEN, undefined);
  });

  it('searches code, name and building without caring about case', async () => {
    const { items } = await service.findAll(query({ q: 'lect' }), TOKEN);

    expect(items.map((item) => item.code)).toEqual(['LECT-6']);
  });

  it('answers 404 for a code Core Hub does not know', async () => {
    referenceData.get.mockResolvedValue(null);

    await expect(service.findOne('NOPE-1', TOKEN)).rejects.toMatchObject({ status: 404 });
  });

  it('describes rooms per code and falls back to null when Core Hub cannot answer', async () => {
    referenceData.get.mockImplementation((_dataset: string, code: string) =>
      code === 'LAB-1'
        ? Promise.resolve(room('LAB-1', 'ห้องปฏิบัติการ 1'))
        : Promise.reject(
            new AppException(ErrorCode.INTERNAL_ERROR, 'unavailable', HttpStatus.SERVICE_UNAVAILABLE),
          ),
    );

    const rooms = await service.describe(['LAB-1', 'LAB-9', 'LAB-1'], TOKEN);

    expect(rooms.get('LAB-1')?.nameTh).toBe('ห้องปฏิบัติการ 1');
    expect(rooms.get('LAB-9')).toBeNull();
    expect(referenceData.get).toHaveBeenCalledTimes(2);
  });
});
