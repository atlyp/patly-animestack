import { useId } from "react";

// Yumemi mark: a crescent moon and a sparkle on a dusk-gradient tile.
export const LogoMark = ({ size = 32, className = "" }) => {
     const id = useId().replace(/:/g, "");
     return (
          <svg
               className={className}
               width={size}
               height={size}
               viewBox="0 0 64 64"
               role="img"
               aria-label="Yumemi logo"
          >
               <defs>
                    <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
                         <stop offset="0" stopColor="#ff6b9a" />
                         <stop offset="0.55" stopColor="#b26bff" />
                         <stop offset="1" stopColor="#5b6cff" />
                    </linearGradient>
                    <mask id={`m${id}`}>
                         <rect width="64" height="64" fill="white" />
                         <circle cx="38" cy="25" r="15" fill="black" />
                    </mask>
               </defs>
               <rect width="64" height="64" rx="16" fill={`url(#g${id})`} />
               <circle cx="30" cy="33" r="17" fill="#fff" mask={`url(#m${id})`} />
               <path
                    d="M46 12 L48.2 18.8 L55 21 L48.2 23.2 L46 30 L43.8 23.2 L37 21 L43.8 18.8 Z"
                    fill="#fff"
               />
          </svg>
     );
};

export const Logo = ({ size = 32 }) => (
     <span className="brand">
          <LogoMark size={size} className="brand__mark" />
          <span className="brand__word">
               yumemi<span className="brand__kanji">夢見</span>
          </span>
     </span>
);
