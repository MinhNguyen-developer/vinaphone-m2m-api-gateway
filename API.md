## Tích hợp Vinaphone M2M API

> **Base URL:** `https://api-m2m.vinaphone.com.vn/api`  
> **Xác thực:** Tất cả API đều yêu cầu Bearer token trong header `Authorization`  
> **Rate limiting:** Giới hạn 1 request/phút cho mỗi user  
> **Định dạng ngày:** `YYYY-MM-DD` hoặc timestamp (Long) nếu không có mô tả riêng

---

## Mục lục

- [1. Authentication](#1-authentication)
- [2. API Thuê Bao (SIM)](#2-api-thuê-bao-sim)
- [3. API Cảnh Báo](#3-api-cảnh-báo)
- [4. API Giám Sát Thuê Bao](#4-api-giám-sát-thuê-bao)
- [5. API Nhóm Chia Sẻ](#5-api-nhóm-chia-sẻ)
- [6. API Thiết Bị & Khách Hàng](#6-api-thiết-bị--khách-hàng)

---

## 1. Authentication

### 1.1 Login

- **Method:** POST
- **URL:** `/auth/token`
- **Request Body:**

\`\`\`json
{
"email": "vienthong88hn@gmail.com",
"password": "abcd@1234",
"rememberMe": true
}
\`\`\`

- **Response:**

\`\`\`json
{
"id_token": "eyJhbGciOiJIUzUxMiJ9...",
"error_code": "OK",
"nbf": 1776176896,
"exp": 1778768896
}
\`\`\`

---

## 2. API Thuê Bao (SIM)

### 2.1 GetListSimByAccount

- **Mục đích:** Lấy danh sách SIM theo tài khoản
- **Method:** GET
- **URL:** `/msimapi/getListSimByAccount?page=1&pageSize=10`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                  | Bắt buộc |
| --- | ------------ | ------------ | ---------------------- | -------- |
| 1   | customerCode | String       | Mã khách hàng          | N        |
| 2   | contractCode | String       | Mã hợp đồng            | N        |
| 3   | page         | String       | Trang                  | N        |
| 4   | pageSize     | String       | Số lượng của một trang | N        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                                            | Bắt buộc |
| --- | ------------ | ------------ | ------------------------------------------------ | -------- |
| 1   | errorCode    | Number       | Mã lỗi                                           | Y        |
| 2   | errorDesc    | String       | Mô tả lỗi                                        | N        |
| 3   | total        | Number       | Tổng số bản ghi                                  | Y        |
| 4   | listSim      | JSON Array   | Danh sách SIM (mỗi bản ghi chứa các trường 5-12) | Y        |
| 5   | msisdn       | String       | Số thuê bao                                      | N        |
| 6   | ratePlanName | String       | Tên gói cước                                     | N        |
| 7   | status       | Number       | Trạng thái                                       | N        |
| 8   | imsi         | String       | IMSI                                             | N        |
| 9   | simGroupName | String       | Nhóm sim                                         | N        |
| 10  | customerName | String       | Tên khách hàng                                   | N        |
| 11  | customerCode | String       | Mã khách hàng                                    | N        |
| 12  | contractCode | String       | Mã hợp đồng                                      | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 22,
  "listSim": [
    {
      "msisdn": "8482*******",
      "ratePlanName": null,
      "status": 1,
      "imsi": "45*******",
      "simGroupName": "*******",
      "customerName": "*******",
      "customerCode": "*******",
      "contractCode": "*******"
    }
  ]
}
```

---

### 2.2 GetSimInfo

- **Mục đích:** Lấy thông tin chi tiết của SIM
- **Method:** GET
- **URL:** `/msimapi/getSimInfo?msisdn=84823384832`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | msisdn      | String       | Số thuê bao | Y        |

**Response Body:**

| STT | Tên tham số     | Kiểu dữ liệu | Mô tả                 | Bắt buộc |
| --- | --------------- | ------------ | --------------------- | -------- |
| 1   | errorCode       | Number       | Mã lỗi                | Y        |
| 2   | errorDesc       | String       | Mô tả lỗi             | N        |
| 3   | msisdn          | String       | Số thuê bao           | N        |
| 4   | dataUsed        | Number       | Dung lượng sử dụng    | N        |
| 5   | chargesIncurred | String       | Cước phát sinh        | N        |
| 6   | planName        | String       | Tên gói cước          | N        |
| 7   | apn             | String       | APN                   | N        |
| 8   | status          | Number       | Trạng thái            | N        |
| 9   | imsi            | String       | IMSI                  | N        |
| 10  | simGroupName    | String       | Nhóm sim              | N        |
| 11  | customerName    | String       | Tên khách hàng        | N        |
| 12  | customerCode    | String       | Mã khách hàng         | N        |
| 13  | contractCode    | String       | Mã hợp đồng           | N        |
| 14  | contractDate    | Date         | Ngày làm hợp đồng     | N        |
| 15  | contractorInfo  | String       | Người làm hợp đồng    | N        |
| 16  | centerCode      | String       | Mã trung tâm          | N        |
| 17  | contactPhone    | String       | Số điện thoại liên hệ | N        |
| 18  | contactAddress  | String       | Địa chỉ liên hệ       | N        |
| 19  | paymentName     | String       | Tên thanh toán        | N        |
| 20  | paymentAddress  | String       | Địa chỉ thanh toán    | N        |
| 21  | routeCode       | String       | Mã tuyến đường        | N        |
| 22  | birthday        | Date         | Sinh nhật khách hàng  | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "msisdn": "84*******",
  "dataUsed": null,
  "chargesIncurred": null,
  "planName": null,
  "apn": null,
  "status": null,
  "imsi": null,
  "simGroupName": "*******",
  "customerName": null,
  "customerCode": "*******",
  "contractCode": "*******",
  "contractDate": "*******",
  "contractorInfo": "*******",
  "centerCode": "3",
  "contactPhone": "84125*******",
  "contactAddress": "So 82 Chua Lang, Dong Da, Ha Noi",
  "paymentName": "Cong ty co phan tu van dau tu xay dung buu dien",
  "paymentAddress": "So 82 Chua Lang, Dong Da, Ha Noi",
  "routeCode": "PNT000-99",
  "birthday": "1998-08-14"
}
```

---

### 2.3 GetTerminalUsageDataDetails

- **Mục đích:** Lấy chi tiết dữ liệu sử dụng của terminal
- **Method:** GET
- **URL:** `/msimapi/getTerminalUsageDataDetails?msisdn=84823384832&fromDate=2024-01-01&toDate=2024-01-31`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | msisdn      | String       | Số thuê bao | Y        |
| 2   | fromDate    | String       | Từ ngày     | Y        |
| 3   | toDate      | String       | Đến ngày    | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                    | Bắt buộc |
| --- | ----------- | ------------ | ------------------------ | -------- |
| 1   | errorCode   | Number       | Mã lỗi                   | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi                | N        |
| 3   | total       | Number       | Tổng số bản ghi          | Y        |
| 4   | data        | JSON Array   | Chi tiết dữ liệu sử dụng | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 30,
  "data": [{ "msisdn": "84823384832", "dataUsed": 1024000 }]
}
```

---

### 2.4 Lấy gói cước của thuê bao

- **Mục đích:** Lấy thông tin các gói cước mà một thuê bao đang đăng ký
- **Method:** GET
- **URL:** `/msimapi/terminal/rating?msidn=84849419355`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                   | Bắt buộc |
| --- | ----------- | ------------ | ----------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi (0 = thành công) | Y        |
| 2   | errorDesc   | String       | Mô tả trạng thái lỗi    | N        |
| 3   | msisdn      | Long         | Số thuê bao             | Y        |
| 4   | ratingPlans | Array        | Danh sách gói cước      | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "msisdn": "84849419355",
  "ratingPlans": [
    { "name": "Goi123", "type": "Dung rieng" },
    { "name": "Goi345", "type": "Thanh vien" },
    { "name": "Goi234", "type": "Chu nhom" }
  ]
}
```

---

### 2.5 Lấy thông tin sử dụng theo ngày

- **Mục đích:** Truy vấn lịch sử sử dụng dữ liệu theo ngày trong 3 tháng gần nhất
- **Method:** GET
- **URL:** `/msimapi/terminal/usage?msisdn=84849419355&fromDate=01-07-2025&toDate=01-08-2025`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |
| 2   | fromDate    | String       | Ngày bắt đầu truy vấn (định dạng: dd-MM-yyyy)         | Y        |
| 3   | toDate      | String       | Ngày kết thúc truy vấn (định dạng: dd-MM-yyyy)        | Y        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                                 | Bắt buộc |
| --- | ------------ | ------------ | ------------------------------------- | -------- |
| 1   | errorCode    | Number       | Mã lỗi (0 = thành công)               | Y        |
| 2   | errorDesc    | String       | Mô tả trạng thái lỗi                  | N        |
| 3   | total        | Number       | Tổng số bản ghi                       | Y        |
| 4   | list         | JSON Array   | Danh sách bản ghi                     | Y        |
| 5   | msisdn       | String       | Số thuê bao                           | N        |
| 6   | usedData     | Double       | Lượng dữ liệu đã sử dụng (KB hoặc MB) | N        |
| 7   | day          | String       | Ngày sử dụng (định dạng: dd/MM/yyyy)  | N        |
| 8   | customerName | String       | Tên khách hàng                        | N        |
| 9   | customerCode | String       | Mã khách hàng                         | N        |
| 10  | contractCode | String       | Mã hợp đồng                           | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 1,
  "list": [
    {
      "msisdn": "84849419355",
      "usedData": 667341,
      "day": "05/11/2024",
      "customerName": "DIEN LUC DA LAT",
      "customerCode": "LDGDD00060131",
      "contractCode": "LDG-LD/00063165"
    }
  ]
}
```

---

### 2.6 Lấy thông tin sử dụng theo tháng

- **Mục đích:** Tổng hợp lưu lượng sử dụng dữ liệu theo tháng
- **Method:** GET
- **URL:** `/msimapi/terminal/usage-month-details?msisdn=84849419355&fromDate=07-2025&toDate=08-2025`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |
| 2   | fromDate    | String       | Tháng bắt đầu truy vấn (định dạng: mm-yyyy)           | Y        |
| 3   | toDate      | String       | Tháng kết thúc truy vấn (định dạng: mm-yyyy)          | Y        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                                 | Bắt buộc |
| --- | ------------ | ------------ | ------------------------------------- | -------- |
| 1   | errorCode    | Number       | Mã lỗi (0 = thành công)               | Y        |
| 2   | errorDesc    | String       | Mô tả trạng thái lỗi                  | N        |
| 3   | total        | Number       | Tổng số bản ghi                       | Y        |
| 4   | list         | JSON Array   | Danh sách bản ghi                     | Y        |
| 5   | msisdn       | String       | Số thuê bao                           | N        |
| 6   | usedData     | Double       | Lượng dữ liệu đã sử dụng (KB hoặc MB) | N        |
| 7   | month        | String       | Tháng sử dụng (định dạng: MM/yyyy)    | N        |
| 8   | customerName | String       | Tên khách hàng                        | N        |
| 9   | customerCode | String       | Mã khách hàng                         | N        |
| 10  | contractCode | String       | Mã hợp đồng                           | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 1,
  "list": [
    {
      "msisdn": "84849419355",
      "usedData": 667341,
      "month": "11/2024",
      "customerName": "DIEN LUC DA LAT",
      "customerCode": "LDGDD00060131",
      "contractCode": "LDG-LD/00063165"
    }
  ]
}
```

---

### 2.7 Lấy thông tin ICCID theo MSISDN

- **Mục đích:** Lấy thông tin ICCID (mã thẻ SIM) dựa trên số thuê bao
- **Method:** GET
- **URL:** `/msimapi/getTerminalsByMsisdn?msisdn=841388109391,841388109596`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả           | Bắt buộc |
| --- | ----------- | ------------ | --------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi          | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi       | N        |
| 3   | total       | Number       | Tổng số bản ghi | Y        |
| 4   | list        | JSON Array   | Danh sách SIM   | Y        |
| 5   | MSISDN      | String       | Số thuê bao     | N        |
| 6   | ICCID       | String       | Mã thẻ SIM      | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 1,
  "errorDesc": "SUCCESS",
  "total": 2,
  "list": [
    { "MSISDN": "841388109391", "ICCID": "8984040000620980850" },
    { "MSISDN": "841388109596", "ICCID": "8984040000620978923" }
  ]
}
```

---

### 2.8 Lấy thông tin ICCID theo IMSI

- **Mục đích:** Lấy thông tin ICCID (mã thẻ SIM) dựa trên IMSI
- **Method:** GET
- **URL:** `/msimapi/getTerminalsByIMSI?imsi=452021161452190,452021170112800`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                   | Bắt buộc |
| --- | ----------- | ------------ | --------------------------------------- | -------- |
| 1   | imsi        | String       | Danh sách IMSI, phân tách bằng dấu phẩy | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả           | Bắt buộc |
| --- | ----------- | ------------ | --------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi          | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi       | N        |
| 3   | total       | Number       | Tổng số bản ghi | Y        |
| 4   | list        | JSON Array   | Danh sách SIM   | Y        |
| 5   | IMSI        | String       | Mã số IMSI      | N        |
| 6   | ICCID       | String       | Mã thẻ SIM      | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 1,
  "errorDesc": "SUCCESS",
  "total": 2,
  "list": [
    { "IMSI": "452021170112800", "ICCID": "8984040000718753007" },
    { "IMSI": "452021161452190", "ICCID": "8984040001484484572" }
  ]
}
```

---

### 2.9 Lấy trạng thái SIM

- **Mục đích:** Trả về trạng thái SIM theo số thuê bao (MSISDN)
- **Method:** GET
- **URL:** `/msimapi/getSimStatus`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                               | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------- | -------- |
| 1   | msisdn      | String       | Số thuê bao cần kiểm tra trạng thái | Y        |

**Response Body:**

| STT | Tên tham số            | Kiểu dữ liệu | Mô tả                          | Bắt buộc |
| --- | ---------------------- | ------------ | ------------------------------ | -------- |
| 1   | errorCode              | int          | 0: thành công, khác 0: lỗi     | Y        |
| 2   | errorDesc              | String       | Mô tả lỗi                      | N        |
| 3   | total                  | Long         | Tổng số bản ghi                | Y        |
| 4   | list                   | Array        | Danh sách trạng thái thuê bao  | Y        |
| 5   | msisdn                 | String       | Số thuê bao                    | N        |
| 6   | status                 | String       | Trạng thái SIM                 | N        |
| 7   | connectionStatus       | String       | ON / OFF / UNKNOWN / NOT FOUND | N        |
| 8   | connectionStatusDetail | String       | Chi tiết trạng thái kết nối    | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 1,
  "list": [
    {
      "msisdn": "84901234567",
      "status": "Hoat dong",
      "connectionStatus": "ON",
      "connectionStatusDetail": "Da ket noi, san sang truyen du lieu va paging"
    }
  ]
}
```

---

### 2.10 Lấy thông tin nhóm chủ sở hữu SIM

- **Mục đích:** Trả về danh sách SIM thuộc nhóm sở hữu theo điều kiện tìm kiếm
- **Method:** GET
- **URL:** `/msimapi/getSimGrOwner`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số  | Kiểu dữ liệu | Bắt buộc | Mặc định     | Mô tả                |
| --- | ------------ | ------------ | -------- | ------------ | -------------------- |
| 1   | msisdn       | String       | N        | null         | Số thuê bao          |
| 2   | customerCode | String       | N        | null         | Mã khách hàng        |
| 3   | isRoaming    | Integer      | N        | 0            | Có roaming hay không |
| 4   | loggable     | boolean      | N        | false        | Ghi log truy vấn     |
| 5   | page         | Integer      | N        | 0            | Trang hiện tại       |
| 6   | size         | Integer      | N        | 10           | Số bản ghi/trang     |
| 7   | sort         | String       | N        | s.msisdn,asc | Trường sắp xếp       |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                               | Bắt buộc |
| --- | ------------ | ------------ | ----------------------------------- | -------- |
| 1   | errorCode    | int          | 0: thành công, khác 0: lỗi          | Y        |
| 2   | errorDesc    | String       | Mô tả lỗi                           | N        |
| 3   | total        | Long         | Tổng số bản ghi                     | Y        |
| 4   | list         | Array        | Danh sách SIM trong nhóm            | Y        |
| 5   | msisdn       | Long         | Số thuê bao                         | N        |
| 6   | customerName | String       | Tên khách hàng                      | N        |
| 7   | customerCode | String       | Mã khách hàng                       | N        |
| 8   | ratingPlan   | Array        | Danh sách gói cước (id, name, type) | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 2,
  "list": [
    {
      "msisdn": 84901234567,
      "customerName": "Nguyen Van A",
      "customerCode": "CUST001",
      "ratingPlan": [{ "id": 101, "name": "Goi cuoc A", "type": "Chu nhom" }]
    }
  ]
}
```

---

### 2.11 Lấy thành viên trong nhóm SIM

- **Mục đích:** Trả về danh sách số thuê bao thuộc một nhóm SIM
- **Method:** GET
- **URL:** `/msimapi/getSimMemberGroup`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Bắt buộc | Mặc định     | Mô tả            |
| --- | ----------- | ------------ | -------- | ------------ | ---------------- |
| 1   | id          | int          | Y        | -            | ID nhóm          |
| 2   | msisdn      | String       | N        |              | Số thuê bao      |
| 3   | loggable    | boolean      | N        | false        | Ghi log truy vấn |
| 4   | page        | Integer      | N        | 0            | Trang hiện tại   |
| 5   | size        | Integer      | N        | 10           | Số bản ghi/trang |
| 6   | sort        | String       | N        | s.msisdn,asc | Trường sắp xếp   |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                  | Bắt buộc |
| --- | ----------- | ------------ | -------------------------------------- | -------- |
| 1   | errorCode   | int          | 0: thành công, khác 0: lỗi             | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi                              | N        |
| 3   | total       | Long         | Tổng số bản ghi                        | Y        |
| 4   | list        | Array[Long]  | Danh sách thuê bao (msisdn) trong nhóm | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 3,
  "list": [84901234567, 84907654321, 84905556666]
}
```

---

## 3. API Cảnh Báo

> **Mô tả tham số `ruleCategory` và `eventType`:**

| ruleCategory | Mô tả nhóm quy tắc          | eventType | Mô tả loại hành động     |
| :----------: | --------------------------- | :-------: | ------------------------ |
|      0       | Giám sát sử dụng            |     7     | Khóa 1 chiều             |
|      0       | Giám sát sử dụng            |     8     | Khóa 2 chiều             |
|      0       | Giám sát sử dụng            |     9     | Khóa 1 chiều - 2 chiều   |
|      1       | Quản lý sử dụng gói cước    |     1     | Data chạm ngưỡng gói     |
|      1       | Quản lý sử dụng gói cước    |     2     | Data chạm ngưỡng giá trị |
|      1       | Quản lý sử dụng gói cước    |     5     | SMS chạm ngưỡng gói      |
|      1       | Quản lý sử dụng gói cước    |     6     | SMS chạm ngưỡng giá trị  |
|      1       | Quản lý sử dụng gói cước    |    12     | Hết hạn ví lưu lượng     |
|      2       | Trạng thái kết nối thuê bao |    16     | Online                   |
|      2       | Trạng thái kết nối thuê bao |    17     | Offline                  |
|      2       | Trạng thái kết nối thuê bao |    18     | Online - Offline         |

---

### 3.1 CreateAlert

- **Mục đích:** Tạo một cảnh báo mới cho thuê bao hoặc nhóm SIM
- **Method:** POST
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Body:**

| STT | Tên tham số        | Kiểu dữ liệu  | Mô tả                             | Bắt buộc |
| --- | ------------------ | ------------- | --------------------------------- | -------- |
| 1   | name               | String        | Tên cảnh báo                      | Y        |
| 2   | customerId         | Long          | ID khách hàng                     | Y        |
| 3   | contractCode       | String        | Mã hợp đồng                       | Y        |
| 4   | subscriptionNumber | Long          | Số thuê bao                       | N        |
| 5   | ruleCategory       | Integer       | Nhóm quy tắc (xem bảng trên)      | Y        |
| 6   | eventType          | Integer       | Loại sự kiện (xem bảng trên)      | Y        |
| 7   | actionType         | Integer       | Loại hành động                    | Y        |
| 8   | severity           | Integer       | Mức độ nghiêm trọng               | Y        |
| 9   | receiveMethods     | Array[String] | Phương thức nhận ("Email", "SMS") | Y        |
| 10  | emailList          | String        | Danh sách email nhận thông báo    | N        |
| 11  | emailContent       | String        | Nội dung email                    | N        |
| 12  | smsList            | String        | Danh sách số nhận SMS             | N        |
| 13  | smsContent         | String        | Nội dung SMS                      | N        |
| 14  | value              | Number        | Ngưỡng giá trị                    | N        |
| 15  | unit               | Integer       | Đơn vị                            | N        |
| 16  | count              | Integer       | Số lần                            | N        |
| 17  | interval           | Integer       | Khoảng thời gian (phút)           | N        |

**Body mẫu:**

```json
{
  "name": "Data Usage Alert",
  "customerId": 3603959,
  "contractCode": "BTN-LD/00104713",
  "subscriptionNumber": 841388259989,
  "ruleCategory": 1,
  "eventType": 1,
  "actionType": 1,
  "severity": 0,
  "receiveMethods": ["Email", "SMS"],
  "emailList": "test@vnpt.vn",
  "emailContent": "Data usage exceeded threshold",
  "smsList": "841388259989",
  "smsContent": "You have exceeded data limit",
  "value": 80,
  "unit": 1,
  "count": 3,
  "interval": 60
}
```

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                     | Bắt buộc |
| --- | ----------- | ------------ | ------------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi                    | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi                 | N        |
| 3   | data        | Object       | Thông tin cảnh báo đã tạo | Y        |

---

### 3.2 ChangeStatusAlert

- **Mục đích:** Thay đổi trạng thái của một cảnh báo hiện có
- **Method:** POST
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert/change-status`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                 | Bắt buộc |
| --- | ----------- | ------------ | ------------------------------------- | -------- |
| 1   | id          | Long         | ID cảnh báo                           | Y        |
| 2   | status      | Integer      | Trạng thái mới (0=Inactive, 1=Active) | Y        |

**Body mẫu:**

```json
{ "id": 525, "status": 1 }
```

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả     | Bắt buộc |
| --- | ----------- | ------------ | --------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi    | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi | N        |

---

### 3.3 UpdateAlert

- **Mục đích:** Cập nhật thông tin của một cảnh báo đã tồn tại
- **Method:** PUT
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert/{id}`
- **Lưu ý:** Chỉ những cảnh báo có `status = 0 (Inactive)` mới được phép cập nhật.

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | id          | Long         | ID cảnh báo | Y        |

**Request Body:**

| STT | Tên tham số        | Kiểu dữ liệu  | Mô tả               | Bắt buộc |
| --- | ------------------ | ------------- | ------------------- | -------- |
| 1   | name               | String        | Tên cảnh báo        | N        |
| 2   | customerId         | Long          | ID khách hàng       | N        |
| 3   | contractCode       | String        | Mã hợp đồng         | N        |
| 4   | subscriptionNumber | Long          | Số thuê bao         | N        |
| 5   | ruleCategory       | Integer       | Nhóm quy tắc        | N        |
| 6   | eventType          | Integer       | Loại sự kiện        | N        |
| 7   | actionType         | Integer       | Loại hành động      | N        |
| 8   | severity           | Integer       | Mức độ nghiêm trọng | N        |
| 9   | receiveMethods     | Array[String] | Phương thức nhận    | N        |
| 10  | emailList          | String        | Danh sách email     | N        |
| 11  | emailContent       | String        | Nội dung email      | N        |
| 12  | statusSim          | Integer       | Trạng thái SIM      | N        |

**Body mẫu:**

```json
{
  "name": "Updated Alert Name",
  "customerId": 3603959,
  "contractCode": "BTN-LD/00104713",
  "subscriptionNumber": 841388259989,
  "ruleCategory": 1,
  "eventType": 1,
  "actionType": 1,
  "severity": 1,
  "receiveMethods": ["Email"],
  "emailList": "updated@vnpt.vn",
  "emailContent": "Threshold reached",
  "statusSim": 0
}
```

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "Thanh cong",
  "data": {
    "createdDate": "2025-10-28T08:35:46.000+00:00",
    "createdBy": 489,
    "id": 525,
    "alertName": "Updated Alert Name",
    "severity": 1,
    "status": 0,
    "customerId": 3603959,
    "simGroupId": null,
    "msisdn": 841388259989,
    "emailContent": "Threshold reached",
    "emails": "updated@vnpt.vn",
    "eventType": 1,
    "ruleCategory": 1,
    "actionType": 1,
    "contractCode": "BTN-LD/00104713",
    "receiveMethods": "[\"Email\"]",
    "updatedDate": "2025-10-28T09:49:21.000+00:00",
    "updatedBy": 489
  }
}
```

---

### 3.4 GetAlertDetail

- **Mục đích:** Xem chi tiết thông tin của một cảnh báo theo ID
- **Method:** GET
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | id          | Long         | ID cảnh báo | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "Thanh cong",
  "data": {
    "name": "Updated Alert Name",
    "customerName": "CONG TY DIEN LUC BINH THUAN",
    "customerCode": "BTNDD00106109",
    "contractCode": "BTN-LD/00104713",
    "subscriptionNumber": "841388259989",
    "statusSim": 1,
    "groupName": null,
    "status": 0,
    "listAlertReceivingGroup": [],
    "emailList": "updated@vnpt.vn",
    "emailContent": "Threshold reached",
    "smsList": null,
    "smsContent": null,
    "interval": null,
    "count": null,
    "unit": null,
    "value": null,
    "severity": 1,
    "customerId": 3603959,
    "groupId": null,
    "ruleCategory": 1,
    "actionType": 1,
    "eventType": 1,
    "dataPackCode": [],
    "receiveMethods": ["Email"],
    "sendMode": null,
    "delayMinutes": null,
    "url": null
  }
}
```

---

### 3.5 SearchAlert

- **Mục đích:** Tra cứu danh sách các cảnh báo đã được thiết lập, hỗ trợ phân trang
- **Method:** GET
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert/search?page={page}&size={size}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                  | Bắt buộc |
| --- | ----------- | ------------ | ---------------------- | -------- |
| 1   | page        | Integer      | Trang                  | N        |
| 2   | size        | Integer      | Số lượng của một trang | N        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả               | Bắt buộc |
| --- | ------------ | ------------ | ------------------- | -------- |
| 1   | errorCode    | Number       | Mã lỗi              | Y        |
| 2   | errorDesc    | String       | Mô tả lỗi           | N        |
| 3   | total        | Number       | Tổng số cảnh báo    | Y        |
| 4   | list         | JSON Array   | Danh sách cảnh báo  | Y        |
| 5   | id           | Long         | ID cảnh báo         | N        |
| 6   | name         | String       | Tên cảnh báo        | N        |
| 7   | ruleCategory | Integer      | Nhóm quy tắc        | N        |
| 8   | eventType    | Integer      | Loại sự kiện        | N        |
| 9   | actionType   | Integer      | Loại hành động      | N        |
| 10  | status       | Integer      | Trạng thái          | N        |
| 11  | severity     | Integer      | Mức độ nghiêm trọng | N        |
| 12  | createdBy    | Long         | Người tạo           | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 11,
  "list": [
    {
      "id": 485,
      "name": "on1001",
      "ruleCategory": 2,
      "eventType": 17,
      "actionType": 0,
      "status": 0,
      "severity": 1,
      "createdBy": 489
    },
    {
      "id": 525,
      "name": "Updated Alert Name",
      "ruleCategory": 1,
      "eventType": 1,
      "actionType": 1,
      "status": 0,
      "severity": 1,
      "createdBy": 489
    }
  ]
}
```

---

### 3.6 DeleteAlert

- **Mục đích:** Xóa một cảnh báo đã được tạo trước đó
- **Method:** DELETE
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/alert/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | id          | Long         | ID cảnh báo | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{ "errorCode": 0, "errorDesc": "SUCCESS" }
```

---

## 4. API Giám Sát Thuê Bao

### 4.1 Bắt đầu giám sát thuê bao

- **Mục đích:** Bắt đầu giám sát thuê bao được chọn
- **Method:** POST
- **URL:** `/msimapi/start-monitoring`
- **Lưu ý:** Request body chỉ chứa **một số duy nhất**, không phải JSON object. Ví dụ: `841388100440`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                             | Bắt buộc |
| --- | ----------- | ------------ | --------------------------------- | -------- |
| 1   | (body)      | Number       | Số thuê bao muốn bắt đầu giám sát | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả     | Bắt buộc |
| --- | ----------- | ------------ | --------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi    | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{ "errorCode": 0, "errorDesc": "Success" }
```

---

### 4.2 Lấy thông tin giám sát thuê bao

- **Mục đích:** Lấy thông tin quá trình giám sát thuê bao được chọn
- **Method:** POST
- **URL:** `/msimapi/monitoring-info/{msisdn}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |

**Response Body:**

| STT | Tên tham số    | Kiểu dữ liệu | Mô tả                                                                    | Bắt buộc |
| --- | -------------- | ------------ | ------------------------------------------------------------------------ | -------- |
| 1   | errorCode      | Number       | Mã lỗi (0 = thành công)                                                  | Y        |
| 2   | errorDesc      | String       | Mô tả trạng thái lỗi                                                     | N        |
| 3   | list           | Array        | Danh sách thông tin giám sát                                             | Y        |
| 4   | msisdn         | Long         | Số thuê bao                                                              | N        |
| 5   | monitoringType | String       | Loại theo dõi (UE_REACHABILITY = online, LOSS_OF_CONNECTIVITY = offline) | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 2,
  "list": [
    { "msisdn": 841388100422, "monitoringType": "UE_REACHABILITY" },
    { "msisdn": 841388100422, "monitoringType": "LOSS_OF_CONNECTIVITY" }
  ]
}
```

---

### 4.3 Lấy thông tin Session

- **Mục đích:** Lấy thông tin về phiên làm việc của thuê bao
- **Method:** POST
- **URL:** `/msimapi/getSessionInfo/{msisdn}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                                 | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------------------------------- | -------- |
| 1   | msisdn      | String       | Chuỗi chứa nhiều số thuê bao, cách nhau bằng dấu phẩy | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                       | Bắt buộc |
| --- | ----------- | ------------ | ------------------------------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi (0 = thành công)                     | Y        |
| 2   | errorDesc   | String       | Mô tả trạng thái lỗi                        | N        |
| 3   | detail      | Object       | Thông tin chi tiết phiên làm việc           | Y        |
| 4   | ip          | String       | Địa chỉ IP                                  | N        |
| 5   | startTime   | Long         | Thời gian bắt đầu (epoch millis)            | N        |
| 6   | endTime     | Long / Null  | Thời gian kết thúc (null nếu chưa kết thúc) | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 1,
  "errorDesc": "SUCCESS",
  "detail": {
    "ip": "31.228.50.108",
    "startTime": 1757576546617,
    "endTime": null
  }
}
```

---

### 4.4 Trạng thái SIM realtime

- **Mục đích:** Lấy trạng thái của SIM theo thời gian thực
- **Method:** GET
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/getSimStatus`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Query Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                    | Bắt buộc |
| --- | ----------- | ------------ | ------------------------ | -------- |
| 1   | msisdn      | String       | Số thuê bao cần kiểm tra | Y        |

**Response Body:**

| STT | Tên tham số            | Kiểu dữ liệu | Mô tả                       | Bắt buộc |
| --- | ---------------------- | ------------ | --------------------------- | -------- |
| 1   | errorCode              | Number       | Mã lỗi (0 = thành công)     | Y        |
| 2   | errorDesc              | String       | Mô tả trạng thái lỗi        | N        |
| 3   | total                  | Number       | Tổng số kết quả             | N        |
| 4   | list                   | Array        | Danh sách thông tin SIM     | Y        |
| 5   | msisdn                 | String       | Số thuê bao                 | N        |
| 6   | status                 | String       | Trạng thái SIM              | N        |
| 7   | connectionStatus       | String       | Trạng thái kết nối          | N        |
| 8   | connectionStatusDetail | String       | Chi tiết trạng thái kết nối | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 1,
  "list": [
    {
      "msisdn": "841388100419",
      "status": "Huy",
      "connectionStatus": "OFF",
      "connectionStatusDetail": "Khong the truy cap"
    }
  ]
}
```

---

### 4.5 Lấy thông tin data của SIM

- **Mục đích:** Lấy thông tin về dung lượng data đã sử dụng và tổng dung lượng của SIM
- **Method:** GET
- **URL:** `https://api-m2m.oneiot.com.vn/api/msimapi/getUsedData`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Query Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                    | Bắt buộc |
| --- | ----------- | ------------ | ------------------------ | -------- |
| 1   | msisdn      | String       | Số thuê bao cần kiểm tra | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                   | Bắt buộc |
| --- | ----------- | ------------ | ----------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi (0 = thành công) | Y        |
| 2   | errorDesc   | String       | Mô tả trạng thái lỗi    | N        |
| 3   | total       | Number       | Tổng số kết quả         | N        |
| 4   | list        | Array        | Danh sách thông tin SIM | Y        |
| 5   | msisdn      | Number       | Số thuê bao             | N        |
| 6   | dataUsed    | Number       | Dung lượng đã sử dụng   | N        |
| 7   | totalData   | Number       | Tổng dung lượng         | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 1,
  "list": [{ "msisdn": 841388100440, "dataUsed": 101440, "totalData": 151660 }]
}
```

---

## 5. API Nhóm Chia Sẻ

### 5.1 Tìm kiếm nhóm chia sẻ

- **Mục đích:** Tìm kiếm nhóm chia sẻ
- **Method:** GET
- **URL:** `/msimapi/share-group/search`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                            | Bắt buộc |
| --- | ----------- | ------------ | -------------------------------- | -------- |
| 1   | groupName   | String       | Tên nhóm cần tìm                 | N        |
| 2   | groupCode   | String       | Mã nhóm cần tìm                  | N        |
| 3   | description | String       | Mô tả nhóm                       | N        |
| 4   | page        | Number       | Số trang (mặc định = 0)          | N        |
| 5   | size        | Number       | Kích thước trang (mặc định = 10) | N        |
| 6   | sort        | String       | Sắp xếp (vd: groupName,asc)      | N        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả           | Bắt buộc |
| --- | ----------- | ------------ | --------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi          | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi       | N        |
| 3   | total       | Number       | Tổng số bản ghi | Y        |
| 4   | list        | JSON Array   | Danh sách nhóm  | Y        |
| 5   | id          | Long         | ID nhóm         | N        |
| 6   | groupName   | String       | Tên nhóm        | N        |
| 7   | groupCode   | String       | Mã nhóm         | N        |
| 8   | description | String       | Mô tả nhóm      | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "Success",
  "list": [
    {
      "id": 101,
      "groupName": "GiaDinh",
      "groupCode": "GD01",
      "description": "Nhom chia se data cho gia dinh"
    }
  ],
  "total": 1
}
```

---

### 5.2 Tạo nhóm chia sẻ

- **Mục đích:** Tạo nhóm chia sẻ mới
- **Method:** POST
- **URL:** `/msimapi/share-group`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                          | Bắt buộc |
| --- | ------------ | ------------ | ------------------------------ | -------- |
| 1   | groupName    | String       | Tên nhóm                       | Y        |
| 2   | groupCode    | String       | Mã nhóm                        | Y        |
| 3   | description  | String       | Mô tả nhóm                     | N        |
| 4   | listSub      | Array        | Danh sách thuê bao thuộc nhóm  | N        |
| 5   | phoneReceipt | String       | Số thuê bao (trong listSub)    | Y        |
| 6   | name         | String       | Tên thuê bao (trong listSub)   | N        |
| 7   | email        | String       | Email thuê bao (trong listSub) | N        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                       | Bắt buộc |
| --- | ------------ | ------------ | --------------------------- | -------- |
| 1   | errorCode    | Number       | Mã lỗi                      | Y        |
| 2   | errorDesc    | String       | Mô tả lỗi                   | N        |
| 3   | detail       | Object       | Thông tin chi tiết nhóm     | Y        |
| 4   | id           | Long         | ID nhóm                     | N        |
| 5   | groupCode    | String       | Mã nhóm                     | N        |
| 6   | groupName    | String       | Tên nhóm                    | N        |
| 7   | description  | String       | Mô tả nhóm                  | N        |
| 8   | createdDate  | DateTime     | Thời gian tạo nhóm          | N        |
| 9   | createdBy    | Number       | Người tạo nhóm (ID user)    | N        |
| 10  | updatedDate  | DateTime     | Thời gian cập nhật gần nhất | N        |
| 11  | updatedBy    | Number       | Người cập nhật cuối         | N        |
| 12  | provinceCode | String       | Mã tỉnh/thành phố           | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "detail": {
    "createdDate": "2025-09-16T09:30:33.000+00:00",
    "createdBy": 343,
    "id": 761,
    "groupCode": "GD0001",
    "groupName": "Gia Dinh",
    "description": "New group for data sharing",
    "updatedDate": null,
    "updatedBy": null,
    "provinceCode": "HNI"
  }
}
```

---

### 5.3 Cập nhật nhóm chia sẻ

- **Mục đích:** Cập nhật nhóm chia sẻ
- **Method:** PUT
- **URL:** `/msimapi/share-group/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ----------- | ------------ | -------------------- | -------- |
| 1   | id          | Long         | ID nhóm cần cập nhật | Y        |

**Request Body:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                          | Bắt buộc |
| --- | ------------ | ------------ | ------------------------------ | -------- |
| 1   | id           | Long         | ID nhóm cần cập nhật           | Y        |
| 2   | groupName    | String       | Tên nhóm cần cập nhật          | Y        |
| 3   | groupCode    | String       | Mã nhóm                        | N        |
| 4   | description  | String       | Mô tả nhóm                     | N        |
| 5   | listSub      | Array        | Danh sách thuê bao thuộc nhóm  | N        |
| 6   | id           | Number       | ID của Sub (trong listSub)     | N        |
| 7   | phoneReceipt | String       | Số thuê bao (trong listSub)    | Y        |
| 8   | name         | String       | Tên thuê bao (trong listSub)   | Y        |
| 9   | email        | String       | Email thuê bao (trong listSub) | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "detail": {
    "id": 761,
    "groupName": "Updated hh000003",
    "groupCode": "hh000003",
    "description": "Updated description",
    "listSub": [
      {
        "id": 18403,
        "phoneReceipt": "0382100002",
        "name": "haiha",
        "email": "hehe",
        "deletedFlag": 1,
        "modifiedBy": 343,
        "modifiedDate": "2025-09-16T09:37:53.000+00:00",
        "provinceCode": "HNI",
        "idGroup": 761
      }
    ]
  }
}
```

---

### 5.4 Xem chi tiết nhóm chia sẻ

- **Mục đích:** Xem chi tiết nhóm chia sẻ
- **Method:** GET
- **URL:** `/msimapi/share-group/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Response Body:**

| STT | Tên tham số  | Kiểu dữ liệu    | Mô tả                              | Bắt buộc |
| --- | ------------ | --------------- | ---------------------------------- | -------- |
| 1   | errorCode    | Number          | Mã lỗi                             | Y        |
| 2   | errorDesc    | String          | Mô tả lỗi                          | N        |
| 3   | detail       | Object          | Thông tin chi tiết nhóm            | Y        |
| 4   | id           | Long            | ID nhóm                            | N        |
| 5   | groupName    | String          | Tên nhóm                           | N        |
| 6   | groupCode    | String          | Mã nhóm                            | N        |
| 7   | description  | String          | Mô tả nhóm                         | N        |
| 8   | listSub      | Array           | Danh sách thuê bao thuộc nhóm      | N        |
| 9   | phoneReceipt | String          | Số thuê bao (trong listSub)        | N        |
| 10  | name         | String          | Tên thuê bao (có thể null)         | N        |
| 11  | email        | String          | Email thuê bao (có thể null)       | N        |
| 12  | deletedFlag  | Number          | Cờ đánh dấu xóa (1=đã xóa, 0=chưa) | N        |
| 13  | modifiedBy   | Number / Null   | Người chỉnh sửa cuối               | N        |
| 14  | modifiedDate | DateTime / Null | Thời gian chỉnh sửa cuối           | N        |
| 15  | provinceCode | String          | Mã tỉnh/thành phố                  | N        |
| 16  | idGroup      | Long            | ID nhóm mà thuê bao thuộc về       | N        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "detail": {
    "id": 761,
    "groupName": "hh000003",
    "groupCode": "hh000003",
    "description": "New group for data sharing",
    "listSub": [
      {
        "createdDate": "2025-09-16T09:30:33.000+00:00",
        "createdBy": 343,
        "id": 18403,
        "phoneReceipt": "0382100002",
        "name": null,
        "email": null,
        "deletedFlag": 1,
        "modifiedBy": null,
        "modifiedDate": null,
        "provinceCode": "HNI",
        "idGroup": 761
      }
    ]
  }
}
```

---

### 5.5 Xóa nhóm chia sẻ

- **Mục đích:** Xóa nhóm chia sẻ
- **Method:** DELETE
- **URL:** `/msimapi/share-group/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả   | Bắt buộc |
| --- | ----------- | ------------ | ------- | -------- |
| 1   | id          | Long         | ID nhóm | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{ "errorCode": 0, "errorDesc": "Success" }
```

---

### 5.6 Xóa thuê bao khỏi nhóm

- **Mục đích:** Xóa một thuê bao khỏi nhóm chia sẻ
- **Method:** DELETE
- **URL:** `/msimapi/share-group/subscriber/{id}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | id          | Long         | ID thuê bao | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{ "errorCode": 0, "errorDesc": "Success" }
```

---

### 5.7 Xóa nhiều thuê bao khỏi nhóm

- **Mục đích:** Xóa nhiều thuê bao khỏi nhóm chia sẻ (tối đa 10 ID)
- **Method:** DELETE
- **URL:** `/msimapi/share-group/subscribers-bulk`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                                        | Bắt buộc |
| --- | ----------- | ------------ | -------------------------------------------- | -------- |
| 1   | ids         | Array[Long]  | Danh sách ID thuê bao trong nhóm (max 10 ID) | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{ "errorCode": 0, "errorDesc": "Success" }
```

---

## 6. API Thiết Bị & Khách Hàng

### 6.1 GetListDevice

- **Mục đích:** Lấy danh sách thiết bị
- **Method:** GET
- **URL:** `/msimapi/getListDevice?page=0&size=10`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                  | Bắt buộc |
| --- | ----------- | ------------ | ---------------------- | -------- |
| 1   | msisdn      | String       | Số thuê bao            | N        |
| 2   | imei        | String       | Mã IMEI thiết bị       | N        |
| 3   | country     | String       | Xuất xứ                | N        |
| 4   | deviceType  | String       | Loại thiết bị          | N        |
| 5   | page        | Integer      | Trang                  | N        |
| 6   | size        | Integer      | Số lượng của một trang | N        |
| 7   | sort        | String       | Sắp xếp                | N        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả              | Bắt buộc |
| --- | ----------- | ------------ | ------------------ | -------- |
| 1   | errorCode   | Number       | Mã lỗi             | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi          | N        |
| 3   | total       | Number       | Tổng số bản ghi    | Y        |
| 4   | data        | JSON Array   | Danh sách thiết bị | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 10,
  "data": [
    {
      "msisdn": "84823384832",
      "imei": "123456789012345",
      "location": "Hanoi",
      "country": "Vietnam",
      "deviceType": "IoT Device"
    }
  ]
}
```

---

### 6.2 GetDetailDevice

- **Mục đích:** Lấy thông tin chi tiết của thiết bị
- **Method:** GET
- **URL:** `/msimapi/getDetailDevice?msisdn=84823384832`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả       | Bắt buộc |
| --- | ----------- | ------------ | ----------- | -------- |
| 1   | msisdn      | Long         | Số thuê bao | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                       | Bắt buộc |
| --- | ----------- | ------------ | --------------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi                      | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi                   | N        |
| 3   | detail      | JSON         | Thông tin chi tiết thiết bị | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "detail": {
    "msisdn": 84949019531,
    "iotLink": null,
    "expiredDate": "2025-07-28T04:06:15.000+00:00",
    "deviceType": null,
    "country": "Vietnam1",
    "imei": null
  }
}
```

---

### 6.3 GetListCustomer

- **Mục đích:** Lấy danh sách khách hàng
- **Method:** GET
- **URL:** `/msimapi/getListCustomer?page=0&size=10`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Request URL Params:**

| STT | Tên tham số  | Kiểu dữ liệu | Mô tả                  | Bắt buộc |
| --- | ------------ | ------------ | ---------------------- | -------- |
| 1   | customerCode | String       | Mã khách hàng          | N        |
| 2   | customerName | String       | Tên khách hàng         | N        |
| 3   | customerType | Integer      | Loại khách hàng        | N        |
| 4   | taxId        | String       | Mã số thuế             | N        |
| 5   | phone        | String       | Số điện thoại          | N        |
| 6   | email        | String       | Email                  | N        |
| 7   | status       | Integer      | Trạng thái             | N        |
| 8   | page         | Integer      | Trang                  | N        |
| 9   | size         | Integer      | Số lượng của một trang | N        |
| 10  | sort         | String       | Sắp xếp                | N        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ----------- | ------------ | -------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi               | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi            | N        |
| 3   | total       | Number       | Tổng số bản ghi      | Y        |
| 4   | data        | JSON Array   | Danh sách khách hàng | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "total": 5,
  "data": [
    {
      "customerCode": "CUST001",
      "customerName": "Cong ty ABC",
      "customerType": 1,
      "taxId": "0123456789",
      "phone": "0987654321",
      "email": "contact@abc.com",
      "status": 1
    }
  ]
}
```

---

### 6.4 GetDetailCustomer

- **Mục đích:** Lấy thông tin chi tiết khách hàng
- **Method:** GET
- **URL:** `/msimapi/getDetailCustomer/{customerId}`

**Headers:**

| STT | Tên tham số   | Kiểu dữ liệu | Mô tả                | Bắt buộc |
| --- | ------------- | ------------ | -------------------- | -------- |
| 1   | Authorization | String       | Sử dụng Bearer token | Y        |

**Path Parameters:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả         | Bắt buộc |
| --- | ----------- | ------------ | ------------- | -------- |
| 1   | customerId  | Long         | ID khách hàng | Y        |

**Response Body:**

| STT | Tên tham số | Kiểu dữ liệu | Mô tả                         | Bắt buộc |
| --- | ----------- | ------------ | ----------------------------- | -------- |
| 1   | errorCode   | Number       | Mã lỗi                        | Y        |
| 2   | errorDesc   | String       | Mô tả lỗi                     | N        |
| 3   | data        | JSON         | Thông tin chi tiết khách hàng | Y        |

**Ví dụ dữ liệu đầu ra:**

```json
{
  "errorCode": 0,
  "errorDesc": "SUCCESS",
  "data": {
    "customerId": 1,
    "customerCode": "CUST001",
    "customerName": "Cong ty ABC",
    "customerType": 1,
    "taxId": "0123456789",
    "phone": "0987654321",
    "email": "contact@abc.com",
    "address": "123 Duong ABC, Ha Noi",
    "status": 1
  }
}
```

{
msisdn: number
iccid: any
status: number
imsi: number
usagedData: number
ratingPlanName: string
ratingPlanId: number
apnId: null
apnName: any
ip: any
vpnChannelName: any
customerName: string
customerCode: string
contractCode: string
contractDate: any
activatedDate: string
contractInfo?: string
groupName: any
centerCode: any
contactPhone: any
contactAddress: any
paymentName: any
paymentAdress: any
birthDay: any
routeCode: any
provinceCode: string
imei: any
connectionStatus: any
startDate?: string
serviceType?: number
simType: number
sog?: string
}
