# Extra registration fields — team decision record (Lab 12, step 3)

ข้อมูลเพิ่มเติมที่ทีมเลือกเก็บ พร้อมเหตุผล — *ทีมควรแก้ไฟล์นี้ให้ตรงกับผลการคุยกันจริงของทีม*

Rule we follow (data minimisation / หลักเก็บเท่าที่จำเป็น): if we cannot say how a field will be used, we do not collect it.

## A. Fields we collect now (built into step 3 of the form)

| # | Field | Stored as | Because… (how the app uses it) |
|---|-------|-----------|--------------------------------|
| 1 | **Pain level during hand movement** (0–10 slider, text changes as it moves) | `extra.painScore` | Games lower their difficulty and repetition count when pain is high. If pain goes up after training, the app tells the user to rest and see a physiotherapist. A score of 7 or more shows a warning before training. |
| 2 | **Personal rehabilitation goal** (pick one + "other") | `extra.goal`, `extra.goalOther` | The app suggests games that train the movement behind the goal. For example, "button a shirt" leads to pinch training. Encouragement messages mention the user's own goal, which helps motivation. |
| 3 | **Previous hand/wrist surgery or injury** (none / right / left / both + detail) | `extra.handSurgery`, `extra.handSurgeryDetail` | A hand that has had surgery starts at a lighter level. Calibration (Lab 27) is kept per side, so the normal range of the operated hand is not compared with the other hand. |

We also record **who filled in the form** (`extra.filledBy`, `extra.filledByName`). This supports the "carer completes it for them" mode and shows who gave the answers.

## B. Five more fields we propose (not built yet)

| # | Proposed field | How it would be used | Sensitivity ⚠️ |
|---|----------------|----------------------|----------------|
| 1 | **Vision level** (normal / wears glasses / low vision) | Turns on large-text or kiosk profile automatically, makes targets bigger and increases contrast. | ⚠️ **Health data** (sensitive under PDPA s.26). Ask only as a simple 3-choice question. Do not ask for a diagnosis. |
| 2 | **Hearing level** (normal / hard of hearing / uses hearing aid) | Makes sound cues louder, and adds visual and vibration cues in place of sounds in rhythm games. | ⚠️ **Health data**, same care as vision. |
| 3 | **Computer / smartphone familiarity** (never / sometimes / every day) | Picks how much on-screen help to show, how long tutorials are, and whether to start in demo mode. | Low sensitivity. Not health data. |
| 4 | **Convenient training times** (morning / afternoon / evening) | Schedules reminders and the daily goal. It also tells us whether results should be compared at the same time of day, since stiffness is often worse in the morning. | Low, but it shows the person's daily routine and when they are home. Keep it on this machine only. |
| 5 | **Dominant-hand strength / grip test result** (from a physiotherapist, optional) | Gives a clinical baseline to compare the app's progress charts against (Lab 29). | ⚠️ **Health data** from a professional. Collect it only with the physiotherapist involved. The user may leave it blank. |

### Fields we considered and rejected

- **National ID number** is not needed for anything in the app and is very high risk if leaked. Rejected.
- **Home address** is not needed for training. Rejected.
- **Photo of the hand** is not needed, because the app works from landmark numbers, not stored images. Rejected.

## C. Sensitivity notes

- Under Thailand's PDPA, health information and biometric data (face images and face feature values) are **sensitive personal data**. They need explicit consent, which is why step 4 has a consent modal with an unticked box and a recorded `consentAt` time.
- All data stays in this browser's IndexedDB. Nothing is uploaded.
- Every field must be deletable. Lab 13's `deleteUserCompletely` removes the user record, faces, sessions, reps and settings.
- Never commit exported JSON backups, face images or real user data to git. Check `.gitignore`.
