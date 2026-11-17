const dateSort = (a, b) => {
     const dateYearOne = new Date(a.aired.from).getFullYear();
     // const dateMonthOne = new Date(a.aired.prop);
     const dateYearTwo = new Date(b.aired.from).getFullYear();
     // const dateMonthTwo = new Date(b.aired.prop);
     console.log(a);
     if (dateYearOne < dateYearTwo) {
          // whatever year is a bigger number- we know came after
          return -1;
     }
};
export const sortFunctionality = (a, b, sortFilter) => {
     if (sortFilter == "A-Z") {
          const nameA = a.title.toLowerCase();
          const nameB = b.title.toLowerCase();
          if (nameA < nameB) {
               return -1;
          }
     }
     if (sortFilter == "Z-A") {
          const nameA = a.title.toLowerCase();
          const nameB = b.title.toLowerCase();
          if (nameA > nameB) {
               return -1;
          }
     }
     if (sortFilter == "Score") {
          return b.favorites - a.favorites;
     }
     if (sortFilter == "Newest To Oldest") {
          const dateYearOne = new Date(a.aired.from).getFullYear();
          const dateYearTwo = new Date(b.aired.from).getFullYear();
          // console.log(a);

          if (dateYearTwo < dateYearOne) {
               // whatever year is a bigger number- we know came after
               return -1;
          }
     }
     if (sortFilter == "Oldest To Newest") {
          return dateSort(a, b);
     }
};

export const bothMatch = (arg1, arg2) => arg1 == arg2;

export const cardsAnimate = (allCards, custom, b4, after) => {
     const cardsWorkingWith = allCards.filter((card) => card !== null);
     // when we change genres - some cards will be "null"- cards that don't meet said genre- so we filter these and access the ones we willa wlays be wokring with

     cardsWorkingWith.forEach((card) => {
          card.style[custom] = b4;
          // go out
     });

     setTimeout(() => {
          cardsWorkingWith.forEach((card) => {
               card.style[custom] = after;
               // come back in
          });
     }, 500);
};
