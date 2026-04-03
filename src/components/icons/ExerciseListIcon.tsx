import React from "react";

interface ExerciseListIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const ExerciseListIcon: React.FC<ExerciseListIconProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12.5 6H20.5" />
    <path d="M13.5 12H20.5" />
    <path d="M11.5 18H20.5" />
    <path d="M4.5 18.25c.55 1.45 2.02 2.25 3.96 2.25 1.98 0 3.82-.82 5.14-2.18 1.12-1.16 1.72-2.63 2.16-4 .22-.67.84-1.12 1.54-1.12h.86c1.29 0 2.34-1.05 2.34-2.34S19.45 8.5 18.16 8.5h-1.08c-.8 0-1.45-.65-1.45-1.45V5.84c0-1.29-1.05-2.34-2.34-2.34-.91 0-1.74.53-2.13 1.35L10.02 7.3c-.42.91-1.33 1.5-2.33 1.5H6.38c-1.03 0-1.88.85-1.88 1.88v2.27" />
    <path d="M4.5 12.95v2.7" />
  </svg>
);

export default ExerciseListIcon;
