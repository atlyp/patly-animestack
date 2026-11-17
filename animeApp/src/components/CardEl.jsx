import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { ImageEl } from "./ImageEl";
import { useState } from "react";
import { addToMyList, removeFromMyList } from "../api";

export const CardEl = ({ product, altText, year, children, showItself, user, refVar }) => {
     const [inMyList, setInMyList] = useState(() =>
          Boolean(user?.myShows?.some((myShow) => myShow.mal_id === showItself.mal_id)),
     );
     const addShowToMyList = async () => {
          try {
               await addToMyList(showItself);
          } catch (e) {
               console.error("Unable to add show to your list:", e);
          }
     };
     const removeShowFromMyList = async () => {
          try {
               await removeFromMyList(showItself);
          } catch (e) {
               console.error("Unable to remove show from your list:", e);
          }
     };
     return (
          <Card ref={refVar} className="animeCard">
               {" "}
               {inMyList ? (
                    <Button
                         variant="danger"
                         onClick={() => {
                              setInMyList(false);
                              removeShowFromMyList();
                         }}
                         style={{ maxWidth: "min-content" }}
                         className="addOrRemoveShowBtn"
                    >
                         {" "}
                         -
                    </Button>
               ) : (
                    <Button
                         variant="success"
                         onClick={() => {
                              setInMyList(true);
                              addShowToMyList();
                         }}
                         style={{ maxWidth: "min-content" }}
                         className="addOrRemoveShowBtn"
                    >
                         {" "}
                         +
                    </Button>
               )}
               <ImageEl imgCaption={altText} imgSrc={`/anime_covers/${product?.mal_id}.jpg`} />
               <Card.Body>
                    <Card.Title className="anime-card__title">
                         {product.title_english || product.title} ({year})
                    </Card.Title>
                    <span className="anime-card__japanese">Japanese title: {product.title_japanese}</span>
                    <span className="anime-card__meta">
                         <h4>{product.type == "TV" ? "TV Show" : product.type}</h4>
                         <h5>
                              {product.type == "Movie"
                                   ? `Released on ${showItself.aired.string}`
                                   : `Aired from -- ${showItself.aired.string}`}
                         </h5>
                         {product.type == "TV" ? showItself.episodes + " episodes." : ""}
                         <h6>{product.rating}</h6>
                    </span>
                    <span className="anime-card__score">★ {product.score} / 10</span>
                    <Card.Text>
                         <span className="anime-card__synopsis">
                              {product.synopsis}
                         </span>
                    </Card.Text>
                    {children}
               </Card.Body>
          </Card>
     );
};
