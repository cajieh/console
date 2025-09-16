import { useCallback } from 'react';
import { TFunction } from 'i18next';
import { useTranslation, UseTranslationOptions } from 'react-i18next';
import { isTranslatableString, getTranslationKey } from './extension-i18n';

/**
 * Extends i18next `useTranslation` hook and overrides the `t` function.
 *
 * Translatable strings in Console application must use the `%key%` pattern.
 */
const useTranslationExt = (ns?: string | string[], options?: UseTranslationOptions<string>) => {
  const result = useTranslation(ns, options);
  const { t } = result;
  const cb = useCallback(
    (value: string) => (isTranslatableString(value) ? t(getTranslationKey(value)) : value),
    [t],
  ) as TFunction;
  return { ...result, t: cb };
};

export default useTranslationExt;
