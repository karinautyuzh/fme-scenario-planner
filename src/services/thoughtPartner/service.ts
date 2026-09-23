import { ThoughtPartnerContext, ThoughtPartnerMessage, ThoughtPartnerResponse } from './types';
import { processMessage } from './localEngine';

export interface IThoughtPartnerService {
  sendMessage(
    message: string,
    context: ThoughtPartnerContext,
    history: ThoughtPartnerMessage[]
  ): Promise<ThoughtPartnerResponse>;
}

// Local prototype — replace with LLM call by swapping this implementation.
// The panel never imports LocalThoughtPartnerService directly; it uses the interface.
class LocalThoughtPartnerService implements IThoughtPartnerService {
  async sendMessage(
    message: string,
    context: ThoughtPartnerContext,
    _history: ThoughtPartnerMessage[]
  ): Promise<ThoughtPartnerResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 350));
    return processMessage(message, context);
  }
}

export function createThoughtPartnerService(): IThoughtPartnerService {
  return new LocalThoughtPartnerService();
}
