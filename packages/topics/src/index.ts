// The topics add-on of the guidebook: topics as a graph of prerequisites, the topic gate and the print order.
// The add-on names no topic: the topics and their areas are input data of the caller.

export { TOPIC_CODES, checkTopics, cyclesOf, prerequisitesOf, printOrder } from "./topics.ts";
export type { Topic, TopicCode, TopicFinding, TopicOptions } from "./topics.ts";
