import { Module } from "@nestjs/common";
import { BatchProcessorService } from "./BatchProcessorService";

@Module({
  providers: [
    {
      provide: BatchProcessorService,
      useFactory: () => {
        return new BatchProcessorService({
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          backoffFactor: 2,
          failureThreshold: 5,
          resetTimeoutMs: 60000,
        });
      },
    },
  ],
  exports: [BatchProcessorService],
})
export class BatchProcessorModule {} 