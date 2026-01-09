/***************
 * THIS IS ONLY HERE TEMPORARILY TO SUPPORT ARRANGER COMPONENTS
 ***************/

import axios from "axios";

const ajax = axios.create();

ajax.interceptors.request.use(
  (config) => {
    // set Authorization headers on a per request basis
    // setting headers on axios get/put/post or common seems to be shared accross all axios instances
    config.headers = {
      ...config.headers,
    };
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export default ajax;
