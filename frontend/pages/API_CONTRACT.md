# Frontend-Backend API Contract

Tai lieu nay chot mapping giua field `name` tren form frontend va DTO backend de ket noi API that.

## Quy uoc chung

- Dung `camelCase` cho ten field trong JSON va DTO Java.
- Form co upload file dung `multipart/form-data`.
- Cac field `id` dung cho thao tac JS; backend map theo `name`.
- Khoa nghiep vu uu tien dung `assetId`, `userId`, `roomId`, `requestId`.

## Auth

- Endpoint de xuat: `POST /api/auth/login`
- DTO de xuat: `LoginRequest`
- Mapping:
  - `username` -> `username`
  - `password` -> `password`

## Student Request

- Endpoint de xuat:
  - `POST /api/requests` (gui ngay)
  - `POST /api/requests/drafts` (luu tam)
- DTO de xuat: `StudentRequestCreateRequest`
- Mapping:
  - `title` -> `title`
  - `note` -> `note`
  - `managerGroup` -> `managerGroup`
  - `requestPriority` -> `priority`
  - `managerName` -> `managerName`
  - `attachment` (file) -> `attachment`

## User

- Endpoint de xuat:
  - `POST /api/users`
  - `PUT /api/users/{userId}`
- DTO de xuat: `UserUpsertRequest`
- Mapping:
  - `username` -> `username`
  - `password` -> `password` (chi can khi tao moi/doi mat khau)
  - `fullName` -> `fullName`
  - `address` -> `address`
  - `phoneNumber` -> `phoneNumber`
  - `role` -> `role`
  - `avatar` (file) -> `avatar`

## Category

- Endpoint de xuat:
  - `POST /api/categories`
  - `PUT /api/categories/{categoryId}`
- DTO de xuat: `CategoryUpsertRequest`
- Mapping:
  - `categoryCode` -> `code`
  - `categoryName` -> `name`
  - `categoryType` -> `type`

## Room

- Endpoint de xuat:
  - `POST /api/rooms`
  - `PUT /api/rooms/{roomId}`
- DTO de xuat: `RoomUpsertRequest`
- Mapping:
  - `roomTargetBuilding` -> `buildingCode`
  - `roomCodeInput`/`roomCode` -> `roomCode`
  - `roomFloorInput` -> `floor`
  - `roomClassUsingInput` -> `classUsing`
  - `roomCapacityInput` -> `capacity`
  - `roomStatus` -> `status`
  - `roomTeacherInput` -> `teacherName`
  - `roomClassInput` -> `classStudying`
  - `roomDesksInput` -> `deskCount`
  - `roomChairsInput` -> `chairCount`
  - `roomSpeakersInput` -> `speakerCount`
  - `roomAirConditionerInput` -> `airConditionerCount`
  - `roomMicrophoneInput` -> `microphoneCount`
  - `roomGlassDoor` -> `glassDoorStatus`
  - `roomCeilingFanInput` -> `ceilingFanCount`
  - `roomCurtain` -> `curtainStatus`

## Asset

- Endpoint de xuat:
  - `POST /api/assets`
  - `PUT /api/assets/{assetId}`
- DTO de xuat: `AssetUpsertRequest`
- Mapping:
  - `assetName` -> `assetName`
  - `provider` -> `provider`
  - `country` -> `country`
  - `cardNumber` -> `cardNumber`
  - `department` -> `department`
  - `classroom` -> `classroom`
  - `assetType` -> `assetType`
  - `itemCategory` -> `itemCategory`
  - `manufactureYear` -> `manufactureYear`
  - `unitPrice` -> `unitPrice`
  - `quantity` -> `quantity`
  - `originalPrice` -> `originalPrice`
  - `fundSource` -> `fundSource`
  - `usageTime` -> `usageTime`
  - `purchaseDate` -> `purchaseDate`
  - `usageYear` -> `usageYear`
  - `buyer` -> `buyer`
  - `note` -> `note`

## Asset Transfer

- Endpoint de xuat: `POST /api/assets/transfers`
- DTO de xuat: `AssetTransferRequest`
- Mapping:
  - `cardNumber` -> `cardNumber`
  - `itemCategory` -> `itemCategory`
  - `assetName` -> `assetName`
  - `assetType` -> `assetType`
  - `sourceBuilding` -> `sourceBuilding`
  - `sourceClassroom` -> `sourceClassroom`
  - `giverName` -> `giverName`
  - `receiverName` -> `receiverName`
  - `targetBuilding` -> `targetBuilding`
  - `targetClassroom` -> `targetClassroom`
  - `receivedDate` -> `receivedDate`

## Asset Rating / Re-Rating

- Endpoint de xuat: `POST /api/assets/{assetId}/ratings`
- DTO de xuat: `AssetRatingRequest`
- Mapping:
  - `reviewerName` -> `reviewerName`
  - `ratingStars` -> `ratingStars`
  - `ratedAt` -> `ratedAt`
  - `ratingNote` -> `ratingNote`

## Liquidation

- Endpoint de xuat: `POST /api/assets/liquidations`
- DTO de xuat: `AssetLiquidationRequest`
- Mapping:
  - `cardNumber` -> `cardNumber`
  - `liquidationDate` -> `liquidationDate`
  - `assetName` -> `assetName`
  - `liquidationReason` -> `liquidationReason`
  - `unitName` -> `unitName`
  - `quantity` -> `quantity`
  - `liquidatedBy` -> `liquidatedBy`
  - `attachments` (files) -> `attachments`
