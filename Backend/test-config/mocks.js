// Backend/test-config/mocks.js

import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/*                                RabbitMQ                                    */
/* -------------------------------------------------------------------------- */

export const publishToQueue = jest.fn().mockResolvedValue(undefined);

/* -------------------------------------------------------------------------- */
/*                                   Redis                                    */
/* -------------------------------------------------------------------------- */

export const mockRedis = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
};

/* -------------------------------------------------------------------------- */
/*                                  Logger                                    */
/* -------------------------------------------------------------------------- */

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

/* -------------------------------------------------------------------------- */
/*                                Reset Mocks                                 */
/* -------------------------------------------------------------------------- */

export const resetAllMocks = () => {
  jest.clearAllMocks();

  publishToQueue.mockResolvedValue(undefined);

  Object.values(mockRedis).forEach((fn) => fn.mockReset());

  Object.values(mockLogger).forEach((fn) => fn.mockReset());
};