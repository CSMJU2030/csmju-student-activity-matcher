import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PortalLink } from '@/components/PortalLink';
import { InterestPicker } from '@/components/InterestPicker';
import { InterestMultiSelect } from '@/components/InterestMultiSelect';
import { InterestCategoryData, InterestWithCategory } from '@/lib/data/interests';

const games: InterestCategoryData = { id: 'c-games', name: 'Games', icon: '🎮', color: '' };
const music: InterestCategoryData = { id: 'c-music', name: 'Music', icon: '🎵', color: '' };
const interest = (id: string, name: string, cat: InterestCategoryData): InterestWithCategory => ({
  id, name, nameLower: name.toLowerCase(), icon: cat.icon, categoryId: cat.id, isCustom: false, isActive: true, category: cat,
});
const all = [interest('i-val', 'Valorant', games), interest('i-mc', 'Minecraft', games), interest('i-kpop', 'K-Pop', music)];

afterEach(() => cleanup());

describe('ConfirmButton', () => {
  it('needs two clicks before running the action', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton onConfirm={onConfirm} confirmLabel="แน่ใจ?">ลบ</ConfirmButton>);

    fireEvent.click(screen.getByRole('button', { name: 'ลบ' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'แน่ใจ?' })); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('InterestPicker', () => {
  const setup = (selectedIds: string[] = []) => {
    const onAdd = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<InterestPicker allInterests={all} categories={[games, music]} selectedIds={selectedIds} onAdd={onAdd} onCreate={onCreate} />);
    return { onAdd, onCreate };
  };

  it('hides interests already picked and adds the one clicked', () => {
    const { onAdd } = setup(['i-val']);
    expect(screen.queryByRole('button', { name: /Valorant/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Minecraft/ }));
    expect(onAdd).toHaveBeenCalledWith('i-mc');
  });

  it('adds a missing game straight into the selected category', async () => {
    const { onCreate } = setup();
    fireEvent.click(screen.getByRole('button', { name: /🎮 Games/ }));
    expect(screen.getByText(/เพิ่มใหม่ ในหมวด 🎮 Games/)).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('ชื่อเกมที่ต้องการเพิ่ม'), { target: { value: 'Monster Hunter' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'เพิ่ม' })); });
    expect(onCreate).toHaveBeenCalledWith('Monster Hunter', 'c-games');
  });

  it('does not offer to create something that already exists', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /🎮 Games/ }));
    fireEvent.change(screen.getByPlaceholderText('ชื่อเกมที่ต้องการเพิ่ม'), { target: { value: 'valorant' } });
    expect(screen.getByRole('button', { name: 'เพิ่ม' })).toHaveProperty('disabled', true);
    expect(screen.getByText(/มี "valorant" อยู่แล้ว/)).toBeTruthy();
  });

  it('asks for a category when "all" is selected', () => {
    const { onCreate } = setup();
    fireEvent.change(screen.getByPlaceholderText('ชื่อ interest ใหม่'), { target: { value: 'Jazz' } });
    expect(screen.getByRole('button', { name: 'เพิ่ม' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c-music' } });
    expect(screen.getByRole('button', { name: 'เพิ่ม' })).toHaveProperty('disabled', false);
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe('InterestMultiSelect', () => {
  it('adds, removes and respects the maximum', () => {
    const onChange = vi.fn();
    const { rerender } = render(<InterestMultiSelect allInterests={all} value={['i-val']} onChange={onChange} max={2} />);

    fireEvent.click(screen.getByRole('button', { name: /Valorant ×/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    fireEvent.click(screen.getByRole('button', { name: /K-Pop/ }));
    expect(onChange).toHaveBeenLastCalledWith(['i-val', 'i-kpop']);

    rerender(<InterestMultiSelect allInterests={all} value={['i-val', 'i-kpop']} onChange={onChange} max={2} />);
    expect(screen.getByRole('button', { name: /Minecraft/ })).toHaveProperty('disabled', true);
  });
});

describe('PortalLink', () => {
  it('links to the Core Hub web origin', () => {
    render(<PortalLink href="http://localhost:3100" />);
    expect(screen.getByRole('link', { name: 'กลับ CSMJU Portal' }).getAttribute('href')).toBe('http://localhost:3100');
  });

  it('renders nothing when CORE_HUB_WEB_URL is not set', () => {
    const { container } = render(<PortalLink href="" />);
    expect(container.firstChild).toBeNull();
  });
});
