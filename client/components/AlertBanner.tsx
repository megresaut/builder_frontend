import React from "react";

interface AlertBannerProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  message,
  actionText = "View",
  onAction,
}) => {
  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgb(255, 255, 255)",
        borderColor: "rgb(229, 229, 255)",
        borderRadius: "16px",
        borderWidth: "1px",
        boxShadow:
          "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 28, 237, 0.07) 4px -4px 14px 0px inset, rgba(237, 0, 217, 0.07) -4px 4px 14px 0px inset",
        fontWeight: "400",
        gap: "12px",
        justifyContent: "space-between",
        padding: "12px 24px",
      }}
    >
      <div
        css={{
          display: "flex",
          alignItems: "center",
          fontWeight: "400",
          gap: "10px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          css={{
            display: "block",
            color: "rgb(29, 64, 127)",
            fill: "none",
            fontWeight: "400",
            height: "16px",
            overflowClipMargin: "content-box",
            overflowX: "hidden",
            overflowY: "hidden",
            stroke: "rgb(29, 64, 127)",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "1.5px",
            width: "16px",
          }}
        >
          <path
            d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            css={{
              display: "inline",
              fill: "none",
              fontWeight: "400",
              stroke: "rgb(29, 64, 127)",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "1.5px",
              transformOrigin: "0px 0px",
            }}
          />
        </svg>
        <div
          css={{
            fontWeight: "500",
            letterSpacing: "-0.32px",
          }}
        >
          <span
            css={{
              display: "inline",
              backgroundClip: "text",
              backgroundImage:
                "linear-gradient(to right, rgb(16, 70, 117), rgb(109, 21, 183), rgb(16, 70, 117))",
              color: "rgba(0, 0, 0, 0)",
              fontSize: "17px",
              fontWeight: "900",
            }}
          >
            <div
              css={{
                display: "inline",
                fontWeight: "900",
              }}
            >
              {title}
            </div>
          </span>
          <div
            css={{
              display: "inline",
              backgroundClip: "text",
              backgroundImage:
                "linear-gradient(to right, rgb(16, 70, 117), rgb(109, 21, 183), rgb(16, 70, 117))",
              color: "rgba(0, 0, 0, 0)",
              fontWeight: "500",
            }}
          >
            {" "}
            - {message}
          </div>
        </div>
      </div>
      <button
        onClick={onAction}
        css={{
          color: "rgb(1, 55, 100)",
          display: "block",
          fontWeight: "500",
          letterSpacing: "-0.32px",
          textDecoration: "underline",
          textDecorationLine: "underline",
          textTransform: "capitalize",
          textWrap: "nowrap",
          transitionDuration: "0.15s",
          transitionProperty:
            "color, background-color, border-color, text-decoration-color, fill, stroke",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          whiteSpace: "nowrap",
          backgroundColor: "rgba(0, 0, 0, 0)",
          borderColor: "rgba(0, 0, 0, 0)",
          border: "none",
          padding: "0",
          cursor: "pointer",
        }}
      >
        {actionText}
      </button>
    </div>
  );
};
