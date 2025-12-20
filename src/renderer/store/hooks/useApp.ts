import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../index';

/**
 * Custom Redux Hooks
 * 
 * Type-safe hooks for accessing Redux state and dispatch
 * throughout the application.
 * 
 * Usage:
 * - useAppDispatch(): Typed dispatch hook
 * - useAppSelector(): Typed selector hook
 */

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;