import urlJoin from "url-join";
import ajax from "./ajax";
import { ARRANGER_API } from "../../../config";

const createArrangerFetcher = ({
  onError = (err: any) => Promise.reject(err),
  onUnauthorized = (response: any) => {},
  defaultHeaders = {},
} = {}) => ({ method = "post", body = {}, headers = {} }) => {
  const uri = urlJoin(ARRANGER_API, "ihcc/graphql");
  return ajax
    .post(uri, body, {
      headers: {
        "Content-Type": "application/json",
        ...(defaultHeaders || {}),
        ...headers,
      },
    })
    .then((response: { data: any }) => {
      return response.data;
    })
    .catch((err: { response: any }) => {
      const { response } = err;
      if ((response || {}).status === 401) {
        return onUnauthorized(response);
      }
      return onError(err);
    });
};
export default createArrangerFetcher;
