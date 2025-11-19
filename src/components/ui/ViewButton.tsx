import React from "react";
import { Eye } from "lucide-react";
import Button, { type ButtonProps } from "./Button";

const ViewButton: React.FC<
  Omit<ButtonProps, "children" | "variant" | "size" | "leftIcon">
> = (props) => {
  return (
    <Button variant="secondary" size="xs" title="View Details" {...props}>
      <Eye size={14} />
    </Button>
  );
};

export default ViewButton;
