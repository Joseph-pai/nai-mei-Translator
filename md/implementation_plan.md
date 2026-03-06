# 修復初次進入 App 時語音播放失效的問題

## 問題描述
在初次開啟 App 後，點擊「奈美說說」只有文字顯示但沒有語音播放。必須先點擊「我想要說」並授權麥克風後，語音播放功能才會恢復正常。

這通常是因為：
1. **瀏覽器自動播放政策 (Autoplay Policy)**：某些瀏覽器（特別是 iOS Safari 或行動版 Chrome）會限制語音合成，直到使用者有了「顯著的互動」。
2. **語音引擎初始化延遲**：`speechSynthesis` 的語音包（voices）在頁面剛載入時可能尚未完全準備好。
3. **麥克風授權副作用**：點擊「我想要說」觸發了麥克風授權，這是一個強烈的互動信號，同時可能也會重新激活瀏覽器的影音元件。

## 擬訂變更

### [Speech 服務組件]

#### [MODIFY] [speech.ts](file:///Users/joseph/Downloads/Translate/nami-chat/src/lib/speech.ts)
- 在 `textToSpeech` 方法中，加入更嚴謹的 `resume()` 與 `cancel()` 序列。
- 考慮加入一個 `unlock()` 靜態方法，用於在第一次互動時播放一段空字串。
- 改進語音包異步加載的處理。

### [主頁面組件]

#### [MODIFY] [page.tsx](file:///Users/joseph/Downloads/Translate/nami-chat/src/app/page.tsx)
- 在 `useEffect` 中加入一個全域點擊事件監聽器（一次性）。
- 當使用者第一次點擊頁面任何位置時，呼叫 `speechService` 的解鎖邏輯，確保後續生成的語音能直接播放。

## 驗證計畫

### 手動測試 (需要使用者協助)
1. 關閉瀏覽器分頁並重新開啟 App。
2. **直接點擊**「奈美說說」，確認是否立刻有聲音。
3. 如果仍無聲音，請嘗試點擊頁面其他地方後再點擊「奈美說說」。
4. 確認「我想要說」功能是否依然正常運作。

> [!IMPORTANT]
> 修改前我會先備份目前的檔案：
> - `src/lib/speech.ts` -> `src/lib/speech.ts.backup.[日期時間]`
> - `src/app/page.tsx` -> `src/app/page.tsx.backup.[日期時間]`
