export const localStorageAdd = (name, item) => {
     if (typeof item == "boolean") return localStorage.setItem(name, item);
     return localStorage.setItem(name, JSON.stringify(item));
};

export const localGet = (name) => {
     //     console.log("the get", JSON.parse(localStorage.getItem(name))?.username);
     return JSON.parse(localStorage.getItem(name));
};
export const signInOffMem = async (disp, action, nav) => {
     // console.log(disp, action, nav);
     let person = localGet("personLoggedIn");
     try {
          const resp = await fetch(`http://localhost:9001/user/staySignedIn/${person}`);
          const data = await resp.json();
          person = data.data;
          disp(action(person));
     } catch (e) {
          console.log(e.message);
     }
};
