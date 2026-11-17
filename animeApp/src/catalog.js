// Shared browse options (match backEnd/anilist.js).
export const GENRES = [
     "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music",
     "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

// Navbar label → server sort key
export const SORTS = {
     Popular: "popular",
     Trending: "trending",
     Score: "score",
     "A-Z": "az",
     "Z-A": "za",
     "Newest To Oldest": "newest",
     "Oldest To Newest": "oldest",
};

// "in 2d 4h", "in 35m", "now"
export const untilText = (at, now) => {
     const ms = at - now;
     if (ms <= 0) return "now";
     const m = Math.round(ms / 60000);
     const d = Math.floor(m / 1440);
     const h = Math.floor((m % 1440) / 60);
     if (d > 0) return `in ${d}d ${h}h`;
     if (h > 0) return `in ${h}h ${m % 60}m`;
     return `in ${m}m`;
};
