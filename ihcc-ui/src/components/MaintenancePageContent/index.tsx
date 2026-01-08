import React from "react";
import Footer from "../Footer";
import { css } from "emotion";
import icon from "./maintenance-logo@2x.png";

const body = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
`;

export default () => (
  <div className={body}>
    <div
      className={css`
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
    >
      <img
        alt="maintenance_icon"
        src={icon}
        className={css`
          width: 297px;
        `}
      />
      <div
        className={css`
          font-size: 26px;
          color: #191970;
          margin: 30px;
        `}
      >
        We are temporarily down for maintenance.
      </div>
      <div
        className={css`
          font-size: 16px;
          color: #202020;
          line-height: 1.25;
        `}
      >
        Sorry for the inconvenience. We should be back online shortly.
      </div>
    </div>
    <Footer />
  </div>
);
