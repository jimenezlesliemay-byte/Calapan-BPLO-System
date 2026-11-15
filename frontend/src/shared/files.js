import { downloadDocument } from '../api';
export async function openDocument(ref,doc) {
  if (!doc.id) throw Error('Document ID is missing.');
  return downloadDocument(ref,doc.id,doc.fileName);
}
