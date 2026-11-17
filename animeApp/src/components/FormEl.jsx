import { Form } from "react-bootstrap";

export const FormEl = ({ children, classes, explicitStyles, wasValidated, onFormSubmit }) => {
     return (
          <div className={classes} style={explicitStyles}>
               <Form onSubmit={onFormSubmit}>{children}</Form>
          </div>
     );
};
