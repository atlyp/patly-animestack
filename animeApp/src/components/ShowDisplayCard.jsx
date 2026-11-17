
import { Card } from "react-bootstrap";

export const ShowDisplayCard = ({ show, children, styles }) => {
     return (
          <>
               {show && (
                    <Card style={styles} className="list-card">
                         
                         <Card.Img variant="top" style={{ height:'75%'}} src={`/anime_covers/${show.mal_id}.jpg`} />
                         <Card.Body>
                              <Card.Text>
                                   <span>{show.title}</span>
                              </Card.Text>
                              {children}
                         </Card.Body>
                    </Card>
               )}
          </>
     );
};
