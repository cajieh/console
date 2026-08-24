/**
 * Annotation key rules mirror Kubernetes ValidateAnnotations / IsLabelKey
 * (keys are lowercased before validation).
 * @see vendor/k8s.io/apimachinery/pkg/api/validation/objectmeta.go
 * @see vendor/k8s.io/apimachinery/pkg/api/validate/content/kube.go
 */

const NAME_PART_MAX = 63;
const PREFIX_MAX = 253;
// name: alphanumeric, optional middle [-A-Za-z0-9_.], start/end alphanumeric
const NAME_PART_RE = /^[A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?$/;
// DNS-1123 subdomain (prefix)
const DNS1123_SUBDOMAIN_RE =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export const isValidAnnotationKey = (key: string): boolean => {
  // Annotations validate with strings.ToLower(key)
  const value = key.toLowerCase();
  const parts = value.split('/');
  if (parts.length > 2) {
    return false;
  }
  let name: string;
  if (parts.length === 2) {
    const [prefix, namePart] = parts;
    name = namePart;
    if (!prefix || prefix.length > PREFIX_MAX || !DNS1123_SUBDOMAIN_RE.test(prefix)) {
      return false;
    }
  } else {
    name = parts[0];
  }
  if (!name || name.length > NAME_PART_MAX || !NAME_PART_RE.test(name)) {
    return false;
  }
  return true;
};

/**
 * Rewrite API error text that uses the k8s field path so it matches the
 * Edit annotations modal labels (Key / Value).
 *
 * Console often surfaces StatusCause style text, e.g.:
 *   Error "Invalid value: \"…\": …" for field "metadata.annotations".
 */
export const formatAnnotationsApiError = (message: string): string => {
  if (!message) {
    return message;
  }
  return message
    .replace(/\bfor field "metadata\.annotations"/gi, 'for field "Key"')
    .replace(/\bmetadata\.annotations:\s*Invalid value:/gi, 'Key: Invalid value:')
    .replace(/\bmetadata\.annotations:\s*Too long:/gi, 'Annotations (Key/Value): Too long:')
    .replace(/\bmetadata\.annotations\b/g, 'Key');
};
