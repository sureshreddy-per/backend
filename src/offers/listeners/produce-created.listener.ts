import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AutoOfferService } from "../services/auto-offer.service";
import { Produce } from "../../produce/entities/produce.entity";

@Injectable()
export class ProduceCreatedListener {
  constructor(private readonly autoOfferService: AutoOfferService) {}

  @OnEvent("produce.created")
  async handleProduceCreated(produce: Produce) {
    await this.autoOfferService.generateOffersForProduce(produce);
  }
}
