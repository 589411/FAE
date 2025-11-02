# A1: 月球基地通訊系統：高速 I/O 訓練

## 🚀 任務背景

歡迎來到月球基地！你是太空探險預備隊的一員，正在接受基礎訓練。在太空中，通訊延遲可能致命，因此我們的通訊系統必須以最高效率運作。你的第一個任務是學習如何使用高速通訊協議與地球指揮中心進行數據傳輸。

在這個訓練模組中，你將學習：
- 如何接收來自地球的指令（標準輸入）
- 如何快速回傳任務數據（標準輸出）
- 為什麼傳統的通訊方式在大量數據傳輸時會失敗

## 📚 知識點說明

### 為什麼需要高速 I/O？

想像你正在月球基地接收來自地球的 100 萬筆感測器數據。如果使用慢速通訊協議，可能需要數小時才能完成傳輸。但在太空任務中，時間就是生命！

**慢速路徑（危險⚠️）：**
```python
# 使用 input() - 適合小型任務，但大量數據時會超時
data = input()
```

**高速路徑（專業✅）：**
```python
import sys
# 使用 sys.stdin.readline() - 專業太空人的選擇
data = sys.stdin.readline()
```

### 通訊協議模板

作為太空探險隊員，你需要熟記以下通訊模板：

## 💻 範例程式碼

### 範例 1：接收單一指令
```python
import sys

# 任務：接收地球發來的火箭發射倒數秒數
countdown = int(sys.stdin.readline())
print(f"火箭將在 {countdown} 秒後發射！")
```

### 範例 2：接收多筆感測器數據
```python
import sys

# 任務：接收一行包含多個溫度讀數的數據
# 輸入格式：5 個用空格分隔的溫度值
# 範例輸入：-120 -85 20 15 -100

temperatures = list(map(int, sys.stdin.readline().strip().split()))
print(f"收到 {len(temperatures)} 筆溫度數據")
print(f"最低溫度：{min(temperatures)}°C")
print(f"最高溫度：{max(temperatures)}°C")
```

### 範例 3：高速輸出任務報告
```python
import sys

# 任務：快速輸出多行任務狀態報告
mission_status = [
    "引擎系統：正常",
    "生命維持系統：正常",
    "通訊系統：正常",
    "導航系統：正常"
]

for status in mission_status:
    sys.stdout.write(status + '\n')
```

## 🔍 程式碼解說

### 關鍵技術點

1. **`sys.stdin.readline()`**
   - 直接從輸入緩衝區讀取，速度是 `input()` 的數倍
   - 會包含行末的換行符號 `\n`，需要用 `.strip()` 移除

2. **`strip()`**
   - 移除字串前後的空白字元（包括空格、換行符號）
   - 確保數據乾淨，避免解析錯誤

3. **`split()`**
   - 將字串按空格分割成列表
   - 例如："1 2 3" → ["1", "2", "3"]

4. **`map(int, ...)`**
   - 將列表中的每個字串元素轉換為整數
   - 配合 `list()` 轉換為列表

### 數據流程圖
```
地球指令 → sys.stdin → readline() → strip() → split() → map(int) → list() → 處理
```

## 📝 Quiz：月球基地通訊測試

### 題目：氧氣補給計算

月球基地收到一批氧氣補給資料。第一行是補給次數 N，接下來 N 行每行包含一個整數，代表該次補給的氧氣量（公升）。請計算：
1. 總補給量
2. 平均每次補給量（四捨五入到整數）
3. 最大單次補給量

**輸入範例：**
```
5
150
200
180
220
190
```

**輸出範例：**
```
總補給量：940 公升
平均補給量：188 公升
最大補給量：220 公升
```

### 💡 提示
- 使用 `sys.stdin.readline()` 讀取每一行
- 使用 `sum()` 計算總和
- 使用 `round()` 進行四捨五入

---

## ✅ Quiz 解答

```python
import sys

# 讀取補給次數
n = int(sys.stdin.readline())

# 讀取所有補給數據
supplies = []
for i in range(n):
    amount = int(sys.stdin.readline())
    supplies.append(amount)

# 計算統計數據
total = sum(supplies)
average = round(total / n)
maximum = max(supplies)

# 輸出結果
print(f"總補給量：{total} 公升")
print(f"平均補給量：{average} 公升")
print(f"最大補給量：{maximum} 公升")
```

### 解答說明

1. **讀取次數**：先讀取 N，知道要處理多少筆數據
2. **迴圈讀取**：使用 `for` 迴圈逐行讀取每次補給量
3. **累積數據**：將每次讀取的數據 `append` 到列表中
4. **統計計算**：
   - `sum(supplies)`：計算總和
   - `round(total / n)`：計算平均值並四捨五入
   - `max(supplies)`：找出最大值
5. **格式化輸出**：使用 f-string 讓輸出更清晰易讀

### 效能分析
- 時間複雜度：O(N) - 需要讀取 N 筆數據
- 空間複雜度：O(N) - 需要儲存 N 筆數據
- I/O 效率：使用 `sys.stdin.readline()`，即使 N = 100,000 也能快速完成

---

## 🎯 訓練完成！

恭喜你完成月球基地通訊系統訓練！你現在已經掌握：
- ✅ 高速 I/O 的重要性
- ✅ 使用 `sys.stdin.readline()` 進行高效輸入
- ✅ 數據解析與格式化輸出
- ✅ 基本的統計計算

**下一站：邏輯控制訓練 - 學習如何在複雜的太空環境中做出正確決策！**

---

## 🔗 APCS 對應能力
- **級分目標**：1-2 級分
- **評量項目**：輸入與輸出、算術運算
- **對應題型**：i399 (數字遊戲)、o076 (特技表演)
