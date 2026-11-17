import Figure from "react-bootstrap/Figure";

export const ImageEl = ({ imgSrc, imgCaption }) => {
     return (
          <Figure
               className="anime-card__figure"
          >
               <Figure.Image className="anime-card__poster" alt={imgCaption} src={imgSrc} />
               <Figure.Caption>{imgCaption}</Figure.Caption>
          </Figure>
     );
};
