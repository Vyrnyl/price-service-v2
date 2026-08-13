-- CreateIndex
CREATE INDEX "Forecast_commodityId_idx" ON "Forecast"("commodityId");

-- CreateIndex
CREATE INDEX "PriceRecord_commodityId_idx" ON "PriceRecord"("commodityId");

-- CreateIndex
CREATE INDEX "PriceRecord_storeId_idx" ON "PriceRecord"("storeId");

-- CreateIndex
CREATE INDEX "PriceRecord_userId_idx" ON "PriceRecord"("userId");

-- CreateIndex
CREATE INDEX "PriceRecord_dateAndTime_idx" ON "PriceRecord"("dateAndTime");

-- CreateIndex
CREATE INDEX "PriceRecord_commodityId_dateAndTime_idx" ON "PriceRecord"("commodityId", "dateAndTime");

-- CreateIndex
CREATE INDEX "Report_generatedBy_idx" ON "Report"("generatedBy");

-- CreateIndex
CREATE INDEX "SRP_commodityId_effectiveDate_idx" ON "SRP"("commodityId", "effectiveDate");

-- CreateIndex
CREATE INDEX "Store_userId_idx" ON "Store"("userId");
