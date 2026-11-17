import { clearSession, fetchMe, getToken } from "./src/api.js";

export const localStorageAdd = (name, item) => {
     if (typeof item == "boolean") return localStorage.setItem(name, item);
     return localStorage.setItem(name, JSON.stringify(item));
};

export const localGet = (name) => {
     try {
          return JSON.parse(localStorage.getItem(name));
     } catch {
          return null;
     }
};

// Restore the logged-in user from the saved token. If the token is missing,
// expired or invalid, log out and go back to the sign-in page.
export const signInOffMem = async (disp, action, nav) => {
     if (!getToken()) {
          clearSession();
          return nav?.("/");
     }
     try {
          const { data } = await fetchMe();
          disp(action(data));
     } catch (e) {
          if (e.status === 401) {
               clearSession();
               nav?.("/");
          } else {
               console.error("Couldn't restore your session:", e.message);
          }
     }
};
