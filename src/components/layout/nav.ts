import type { IconType } from 'react-icons';
import {
  IoGridOutline,
  IoSwapHorizontalOutline,
  IoWalletOutline,
  IoFlagOutline,
  IoPricetagsOutline,
  IoSettingsOutline,
} from 'react-icons/io5';

export type PageId =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'categories'
  | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: IconType;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IoGridOutline },
  { id: 'transactions', label: 'Transactions', icon: IoSwapHorizontalOutline },
  { id: 'budgets', label: 'Budgets', icon: IoWalletOutline },
  { id: 'goals', label: 'Goals', icon: IoFlagOutline },
  { id: 'categories', label: 'Categories', icon: IoPricetagsOutline },
  { id: 'settings', label: 'Settings', icon: IoSettingsOutline },
];
