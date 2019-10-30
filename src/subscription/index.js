import {PubSub} from "apollo-server";

import * as MESSAGE_EVENTS from "./message";
import * as POST_EVENTS from "./post";

export const EVENTS = {
  MESSAGE: MESSAGE_EVENTS,
  POST: POST_EVENTS
};

export default new PubSub();
