// All account validation is performed by LavaLust against the Aiven MySQL database.
import { request } from './api';
const SESSION='bplo-api-session';
let meRequest = null;
export const allUsers = () => []; // No browser-stored applicant passwords or demo accounts.
export function currentUser() { try {return JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{return null;} }
function signIn(data) {
  if (!data?.token || !data?.user) throw Error('Invalid login response from backend.');
  localStorage.setItem('bplo-token',data.token);
  sessionStorage.setItem(SESSION,JSON.stringify(data.user));
  return data.user;
}
export async function login(email,password,role) { return signIn(await request('/auth/login','POST',{email,password,role})); }
export async function register(fields) { return signIn(await request('/auth/register','POST',fields)); }
export async function fetchMe() {
  if(!localStorage.getItem('bplo-token')) return null;
  if (meRequest) return meRequest;
  meRequest = (async () => {
    try { const data = await request('/auth/me'); sessionStorage.setItem(SESSION,JSON.stringify(data.user)); return data.user; }
    catch { logout(); return null; }
  })();
  try { return await meRequest; }
  finally { meRequest = null; }
}
export async function updateProfile(id, fields) { const data = await request('/profile','PUT',fields); sessionStorage.setItem(SESSION,JSON.stringify(data.user)); return data.user; }
export async function changePassword(id, oldPassword, newPassword) { return request('/profile','PUT',{oldPassword,newPassword}); }
export function logout() { const token=localStorage.getItem('bplo-token'); if(token) request('/auth/logout','POST',{}).catch(()=>{});localStorage.removeItem('bplo-token');sessionStorage.removeItem(SESSION); }
