import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../index';

/**
 * Custom Redux Hooks
 * Use these throughout your app instead of plain `useDispatch` and `useSelector`
 * They provide full type safety
 */

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;