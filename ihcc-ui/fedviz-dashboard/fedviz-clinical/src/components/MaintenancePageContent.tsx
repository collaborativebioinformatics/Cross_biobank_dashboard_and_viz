import React from "react";
import { css } from "@emotion/css";
import Footer from "./Footer";
import icon from "./GGMC_logo.png";

const body = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100vh;
  background: #ffffff;
`;

export default function MaintenancePageContent() {
  return (
    <div className={body}>
      <div
        className={css`
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          padding: 24px;
        `}
      >
        <img
          alt="maintenance_icon"
          src={icon}
          className={css`
            width: 220px;
            margin-bottom: 24px;
          `}
        />
        <div
          className={css`
            font-size: 26px;
            color: #191970;
            margin-bottom: 12px;
            text-align: center;
          `}
        >
          We are temporarily down for maintenance.
        </div>
        <div
          className={css`
            font-size: 16px;
            color: #202020;
            text-align: center;
            max-width: 420px;
            line-height: 1.4;
          `}
        >
          Sorry for the inconvenience. We should be back shortly.
        </div>
      </div>
      <Footer />
    </div>
  );
}
