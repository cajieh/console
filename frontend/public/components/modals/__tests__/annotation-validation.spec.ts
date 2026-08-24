import {
  formatAnnotationsApiError,
  isValidAnnotationKey,
} from '../annotation-validation';

describe('isValidAnnotationKey', () => {
  it('accepts simple keys', () => {
    expect(isValidAnnotationKey('app')).toBe(true);
    expect(isValidAnnotationKey('MyName')).toBe(true);
    expect(isValidAnnotationKey('my.name')).toBe(true);
    expect(isValidAnnotationKey('123-abc')).toBe(true);
  });

  it('accepts prefixed keys', () => {
    expect(isValidAnnotationKey('example.com/MyName')).toBe(true);
    expect(isValidAnnotationKey('openshift.io/description')).toBe(true);
  });

  it('rejects empty or invalid keys', () => {
    expect(isValidAnnotationKey('')).toBe(false);
    expect(isValidAnnotationKey('/name')).toBe(false);
    expect(isValidAnnotationKey('prefix/')).toBe(false);
    expect(isValidAnnotationKey('a/b/c')).toBe(false);
    expect(isValidAnnotationKey('-bad')).toBe(false);
    expect(isValidAnnotationKey('bad-')).toBe(false);
  });

  it('rejects non-ASCII keys (e.g. Japanese characters from OCPBUGS-43615)', () => {
    expect(isValidAnnotationKey('装飾行動レビュー')).toBe(false);
    expect(
      isValidAnnotationKey(
        '3装飾行動レビュー会議政治存在発表劇場読書教育3装飾行動レビュー会議政治存在発表劇場読書教育',
      ),
    ).toBe(false);
  });

  it('rejects name parts longer than 63 characters', () => {
    expect(isValidAnnotationKey('a'.repeat(64))).toBe(false);
    expect(isValidAnnotationKey('a'.repeat(63))).toBe(true);
  });
});

describe('formatAnnotationsApiError', () => {
  it('rewrites StatusCause-style for field "metadata.annotations"', () => {
    const api =
      'Error "Invalid value: "装飾行動レビュ": name part must consist of alphanumeric characters, \'-\', \'_\' or \'.\', and must start and end with an alphanumeric character (e.g. \'MyName\', or \'my.name\', or \'123-abc\', regex used for validation is \'([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]\')" for field "metadata.annotations".';
    const formatted = formatAnnotationsApiError(api);
    expect(formatted).toContain('for field "Key"');
    expect(formatted).not.toContain('metadata.annotations');
  });

  it('rewrites metadata.annotations Invalid value to Key', () => {
    const api =
      'Project "demo" is invalid: metadata.annotations: Invalid value: "装飾": name part must consist of alphanumeric characters';
    expect(formatAnnotationsApiError(api)).toContain('Key: Invalid value:');
    expect(formatAnnotationsApiError(api)).not.toContain('metadata.annotations');
  });

  it('rewrites Too long field path', () => {
    const api = 'metadata.annotations: Too long: may not be more than 262144 bytes';
    expect(formatAnnotationsApiError(api)).toBe(
      'Annotations (Key/Value): Too long: may not be more than 262144 bytes',
    );
  });

  it('returns empty message unchanged', () => {
    expect(formatAnnotationsApiError('')).toBe('');
  });
});
