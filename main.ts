namespace Servo_Advaune {

    // เก็บองศาปัจจุบันแยกตามแต่ละพิน แทน currentAngle ตัวเดียวที่ใช้ร่วมกันผิด ๆ
    let angleState: number[] = []

    function getCurrentAngle(pin: AnalogPin): number {
        if (angleState[pin] == undefined) {
            angleState[pin] = 90   // สมมติองศาเริ่มต้น ถ้ายังไม่เคยสั่งพินนี้มาก่อน
        }
        return angleState[pin]
    }

    //% blockId=servo_set_angle
    //% block="servo %pin set angle %angle"
    //% weight=100
    export function setAngle(pin: AnalogPin, angle: number): void {
        if (angle > 180) angle = 180
        if (angle < 0) angle = 0
        pins.servoWritePin(pin, angle)
        angleState[pin] = angle
    }

    //% blockId=servo_move_relative
    //% block="servo %pin move %direction by %angle degrees"
    //% weight=90
    export function moveRelative(pin: AnalogPin, direction: Direction, angle: number): void {
        let target = getCurrentAngle(pin) + direction * angle
        if (target > 180) target = 180
        if (target < 0) target = 0
        pins.servoWritePin(pin, target)
        angleState[pin] = target
    }

    //% blockId=servo_move_smooth
    //% block="servo %pin move smooth to %end in %time ms"
    //% weight=95
    export function moveSmooth(pin: AnalogPin, end: number, time: number): void {
        if (end > 180) end = 180
        if (end < 0) end = 0

        let start = getCurrentAngle(pin)   // ✅ ใช้ตำแหน่งจริงปัจจุบันเสมอ กันกระตุกตอนเริ่ม
        let steps = Math.abs(Math.round(end - start))
        if (steps == 0) return

        if (time <= 0) {   // ✅ กัน time<=0 ทำให้ pause แปลก ๆ
            pins.servoWritePin(pin, end)
            angleState[pin] = end
            return
        }

        let startTime = input.runningTime()

        for (let i = 0; i <= steps; i++) {
            let t = i / steps
            let ease = t * t * (3 - 2 * t)   // smoothstep
            let angle = start + (end - start) * ease
            pins.servoWritePin(pin, angle)

            // ✅ เทียบเวลาจริงแทนหาร time/steps ตรง ๆ กัน drift สะสม
            let targetElapsed = (time * i) / steps
            let actualElapsed = input.runningTime() - startTime
            let waitMs = targetElapsed - actualElapsed
            if (waitMs > 0) basic.pause(waitMs)
        }

        angleState[pin] = end   // ✅ อัปเดต state ให้ moveRelative ครั้งถัดไปคำนวณถูก
    }

    //% blockId=servo_tune
    //% block="set servo %pin by buttons (A=+, B=-, A+B=ok)"
    //% weight=110
    export function tuneServo(pin: AnalogPin): number {
        // ⚠️ ควรเรียกฟังก์ชันนี้แค่ครั้งเดียวต่อพินตอน setup/calibration
        // (MakeCode ไม่มี API ถอด handler — เรียกซ้ำจะสะสม handler เก่าไว้เรื่อย ๆ)
        let angle2 = getCurrentAngle(pin)   // ✅ เริ่มจากตำแหน่งจริง ไม่ใช่ 90 ตายตัว
        let done = false

        pins.servoWritePin(pin, angle2)

        input.onButtonPressed(Button.A, function () {
            if (!done) {
                angle2 += 1
                if (angle2 > 180) angle2 = 180
                pins.servoWritePin(pin, angle2)
                basic.showNumber(angle2)
            }
        })

        input.onButtonPressed(Button.B, function () {
            if (!done) {
                angle2 -= 1
                if (angle2 < 0) angle2 = 0
                pins.servoWritePin(pin, angle2)
                basic.showNumber(angle2)
            }
        })

        input.onButtonPressed(Button.AB, function () {
            done = true
            basic.clearScreen()
        })

        while (!done) {
            basic.pause(50)
        }

        angleState[pin] = angle2   // ✅ บันทึกผลจูนกลับเข้า state กลาง
        return angle2
    }
}
