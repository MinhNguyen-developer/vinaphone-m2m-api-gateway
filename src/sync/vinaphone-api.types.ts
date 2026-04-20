// ─── quickSearch ─────────────────────────────────────────────────────────────

/** One entry inside the `sog` JSON string field of a QuickSearchSimItem */
export interface SogItem {
  id: string;
  ten_goi: string;
  ma_goi: string;
  phan_loai: number;
  is_roaming: number;
  /** null = SIM này là chủ nhóm; có giá trị = SIM này là thành viên */
  msisdn_chu_nhom: string | null;
}

/** One SIM returned by GET /sim-mgmt/memberOfGr */
export interface MemberOfGrItem {
  msisdn: number;
  status: number;
  ratingPlanName: string | null;
  [key: string]: unknown;
}

export interface MemberOfGrResponse {
  content: MemberOfGrItem[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  empty: boolean;
}

export interface QuickSearchParams {
  msisdn?: string | null;
  imsi?: string | null;
  ratingPlanId?: number | null;
  ratingPlanType?: string | null;
  contractCode?: string | null;
  contractor?: string | null;
  /** Numeric status: 1=Mới, 2=Đang hoạt động, 3=Tạm khoá, 4=Huỷ */
  status?: number | null;
  simGroupId?: number | null;
  customer?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  apnId?: number | null;
  simType?: number | null;
  provinceCode?: string | null;
  userId?: number | null;
  loggable?: boolean;
  ip?: string | null;
  page?: number;
  size?: number;
  sort?: string;
  keySearch?: string;
}

export interface QuickSearchSimItem {
  msisdn: number;
  iccid: string | null;
  /** 1=Mới, 2=Đang hoạt động, 3=Tạm khoá, 4=Huỷ */
  status: number;
  imsi: number;
  usagedData: number; // bytes
  ratingPlanName: string;
  ratingPlanId: number;
  apnId: number | null;
  apnName: string | null;
  ip: string | null;
  vpnChannelName: string | null;
  customerName: string;
  customerCode: string;
  contractCode: string;
  contractDate: string | null;
  activatedDate: string | null;
  contractInfo: string | null;
  groupName: string | null;
  centerCode: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  paymentName: string | null;
  paymentAdress: string | null;
  birthDay: string | null;
  routeCode: string | null;
  provinceCode: string | null;
  imei: string | null;
  connectionStatus: string | null;
  startDate: string | null;
  serviceType: number | null;
  simType: number;
  sog: string | null;
}

export interface RatingPlanItem {
  id: number;
  code: string;
  name: string;
}

export interface GroupSimItem {
  id: number;
  name: string;
  groupKey: string;
}

export interface UsedDataItem {
  msisdn: number;
  usedData: string; // e.g. "65008912198" (in bytes)
}

export interface QuickSearchPageable {
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface VinaphoneApiBaseResponse<T> {
  content: T[];
  pageable: QuickSearchPageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// ─── Authentication ───────────────────────────────────────────────────────────

export interface VinaphoneLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VinaphoneLoginResponse {
  id_token: string;
  error_code: string;
  nbf: number;
  exp: number; // Unix timestamp (seconds)
}

// ─── Base response ────────────────────────────────────────────────────────────

export interface VinaphoneBaseResponse {
  errorCode: number; // 0 = success
  errorDesc: string;
}

// ─── 2. API Thuê Bao (SIM) ────────────────────────────────────────────────────

export interface SimListItem {
  msisdn: string;
  ratePlanName: string | null;
  status: number;
  imsi: string;
  simGroupName: string;
  customerName: string;
  customerCode: string;
  contractCode: string;
}

export interface GetListSimByAccountResponse extends VinaphoneBaseResponse {
  total: number;
  listSim: SimListItem[];
}

export interface GetListSimByAccountParams {
  customerCode?: string;
  contractCode?: string;
  page?: number;
  pageSize?: number;
}

export interface GetSimInfoResponse extends VinaphoneBaseResponse {
  msisdn: string;
  dataUsed: number | null;
  chargesIncurred: string | null;
  planName: string | null;
  apn: string | null;
  status: number | null;
  imsi: string | null;
  simGroupName: string;
  customerName: string | null;
  customerCode: string;
  contractCode: string;
  contractDate: string;
  contractorInfo: string;
  centerCode: string;
  contactPhone: string;
  contactAddress: string;
  paymentName: string;
  paymentAddress: string;
  routeCode: string;
  birthday: string;
}

export interface TerminalUsageDataItem {
  msisdn: string;
  dataUsed: number;
  [key: string]: unknown;
}

export interface GetTerminalUsageDataDetailsResponse extends VinaphoneBaseResponse {
  total: number;
  data: TerminalUsageDataItem[];
}

export interface RatingPlan {
  name: string;
  type: string;
}

export interface GetTerminalRatingResponse extends VinaphoneBaseResponse {
  msisdn: string;
  ratingPlans: RatingPlan[];
}

export interface UsageByDayItem {
  msisdn: string;
  usedData: number; // KB
  day: string; // dd/MM/yyyy
  customerName: string;
  customerCode: string;
  contractCode: string;
}

export interface GetTerminalUsageDayResponse extends VinaphoneBaseResponse {
  total: number;
  list: UsageByDayItem[];
}

export interface UsageByMonthItem {
  msisdn: string;
  usedData: number; // KB
  month: string; // MM/yyyy
  customerName: string;
  customerCode: string;
  contractCode: string;
}

export interface GetTerminalUsageMonthResponse extends VinaphoneBaseResponse {
  total: number;
  list: UsageByMonthItem[];
}

export interface IccidByMsisdnItem {
  MSISDN: string;
  ICCID: string;
}

export interface GetTerminalsByMsisdnResponse extends VinaphoneBaseResponse {
  total: number;
  list: IccidByMsisdnItem[];
}

export interface IccidByImsiItem {
  IMSI: string;
  ICCID: string;
}

export interface GetTerminalsByIMSIResponse extends VinaphoneBaseResponse {
  total: number;
  list: IccidByImsiItem[];
}

export type ConnectionStatus = 'ON' | 'OFF' | 'UNKNOWN' | 'NOT FOUND';

export interface SimStatusItem {
  msisdn: string;
  status: string;
  connectionStatus: ConnectionStatus;
  connectionStatusDetail: string;
}

export interface GetSimStatusResponse extends VinaphoneBaseResponse {
  total: number;
  list: SimStatusItem[];
}

export interface RatingPlanInfo {
  id: number;
  name: string;
  type: string;
}

export interface SimGrOwnerItem {
  msisdn: number;
  customerName: string;
  customerCode: string;
  ratingPlan: RatingPlanInfo[];
}

export interface GetSimGrOwnerResponse extends VinaphoneBaseResponse {
  total: number;
  list: SimGrOwnerItem[];
}

export interface GetSimMemberGroupResponse extends VinaphoneBaseResponse {
  total: number;
  list: number[]; // list of msisdn (Long)
}

// ─── 3. API Cảnh Báo ─────────────────────────────────────────────────────────

/**
 * ruleCategory=0: Giám sát sử dụng        → eventType: 7(Khoá 1 chiều), 8(Khoá 2 chiều), 9(Khoá 1-2 chiều)
 * ruleCategory=1: Quản lý gói cước         → eventType: 1(Data gói), 2(Data giá trị), 5(SMS gói), 6(SMS giá trị), 12(Hết hạn ví)
 * ruleCategory=2: Trạng thái kết nối       → eventType: 16(Online), 17(Offline), 18(Online-Offline)
 */
export type RuleCategory = 0 | 1 | 2;
export type EventType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 12 | 16 | 17 | 18;
export type ReceiveMethod = 'Email' | 'SMS';
export type AlertStatus = 0 | 1; // 0=Inactive, 1=Active

export interface AlertListItem {
  id: number;
  name: string;
  ruleCategory: RuleCategory;
  eventType: EventType;
  actionType: number;
  status: AlertStatus;
  severity: number;
  createdBy: number;
}

export interface SearchAlertResponse extends VinaphoneBaseResponse {
  total: number;
  list: AlertListItem[];
}

export interface AlertDetail {
  name: string;
  customerName: string;
  customerCode: string;
  contractCode: string;
  subscriptionNumber: string;
  statusSim: number;
  groupName: string | null;
  status: AlertStatus;
  listAlertReceivingGroup: unknown[];
  emailList: string | null;
  emailContent: string | null;
  smsList: string | null;
  smsContent: string | null;
  interval: number | null;
  count: number | null;
  unit: number | null;
  value: number | null;
  severity: number;
  customerId: number;
  groupId: number | null;
  ruleCategory: RuleCategory;
  actionType: number;
  eventType: EventType;
  dataPackCode: unknown[];
  receiveMethods: ReceiveMethod[];
  sendMode: unknown | null;
  delayMinutes: number | null;
  url: string | null;
}

export interface GetAlertDetailResponse extends VinaphoneBaseResponse {
  data: AlertDetail;
}

export interface CreateAlertRequest {
  name: string;
  customerId: number;
  contractCode: string;
  subscriptionNumber?: number;
  ruleCategory: RuleCategory;
  eventType: EventType;
  actionType: number;
  severity: number;
  receiveMethods: ReceiveMethod[];
  emailList?: string;
  emailContent?: string;
  smsList?: string;
  smsContent?: string;
  value?: number;
  unit?: number;
  count?: number;
  interval?: number;
}

export interface ChangeAlertStatusRequest {
  id: number;
  status: AlertStatus;
}

// ─── 4. API Giám Sát Thuê Bao ────────────────────────────────────────────────

export type MonitoringType = 'UE_REACHABILITY' | 'LOSS_OF_CONNECTIVITY';

export interface MonitoringInfoItem {
  msisdn: number;
  monitoringType: MonitoringType;
}

export interface GetMonitoringInfoResponse extends VinaphoneBaseResponse {
  total: number;
  list: MonitoringInfoItem[];
}

export interface SessionDetail {
  ip: string;
  startTime: number; // epoch millis
  endTime: number | null;
}

export interface GetSessionInfoResponse extends VinaphoneBaseResponse {
  detail: SessionDetail;
}

export interface GetUsedDataItem {
  msisdn: number;
  dataUsed: number; // KB
  totalData: number; // KB
}

export interface GetUsedDataResponse extends VinaphoneBaseResponse {
  total: number;
  list: GetUsedDataItem[];
}

// ─── 5. API Nhóm Chia Sẻ ─────────────────────────────────────────────────────

export interface ShareGroupItem {
  id: number;
  groupName: string;
  groupCode: string;
  description: string;
}

export interface SearchShareGroupResponse extends VinaphoneBaseResponse {
  total: number;
  list: ShareGroupItem[];
}

export interface ShareGroupSubscriber {
  id?: number;
  phoneReceipt: string;
  name?: string;
  email?: string;
}

export interface ShareGroupSubscriberDetail extends ShareGroupSubscriber {
  deletedFlag: number;
  modifiedBy: number | null;
  modifiedDate: string | null;
  provinceCode: string;
  idGroup: number;
}

export interface ShareGroupDetail {
  id: number;
  groupName: string;
  groupCode: string;
  description: string;
  listSub: ShareGroupSubscriberDetail[];
  createdDate?: string;
  createdBy?: number;
  updatedDate?: string | null;
  updatedBy?: number | null;
  provinceCode?: string;
}

export interface ShareGroupDetailResponse extends VinaphoneBaseResponse {
  detail: ShareGroupDetail;
}

export interface CreateShareGroupRequest {
  groupName: string;
  groupCode: string;
  description?: string;
  listSub?: ShareGroupSubscriber[];
}

export interface UpdateShareGroupRequest {
  id: number;
  groupName: string;
  groupCode?: string;
  description?: string;
  listSub?: ShareGroupSubscriber[];
}
