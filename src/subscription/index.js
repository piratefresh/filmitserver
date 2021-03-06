import { PubSub } from "apollo-server";

import * as MESSAGE_EVENTS from "./message";
import * as POST_EVENTS from "./post";
import * as CHANNEL_EVENTS from "./channel";
import * as NOTIFICATION_EVENTS from "./notification";

export const EVENTS = {
  MESSAGE: MESSAGE_EVENTS,
  POST: POST_EVENTS,
  CHANNEL: CHANNEL_EVENTS,
  NOTIFICATION: NOTIFICATION_EVENTS
};

export default new PubSub();
