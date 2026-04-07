namespace Servo_Advaune {

    let currentAngle = 90

    //% blockId=servo_set_angle
    //% block="servo %pin set angle %angle"
    //% weight=100
    export function setAngle(pin: AnalogPin, angle: number): void {
        if (angle > 180) angle = 180
        if (angle < 0) angle = 0

        pins.servoWritePin(pin, angle)
        currentAngle = angle
    }

    //% blockId=servo_move_relative
    //% block="servo %pin move %direction by %angle degrees"
    //% weight=90
    export function moveRelative(pin: AnalogPin, direction: Direction, angle: number): void {
        let target = currentAngle + direction * angle

        if (target > 180) target = 180
        if (target < 0) target = 0

        pins.servoWritePin(pin, target)
        currentAngle = target
    }

    //% blockId=smooth_servo_move
    //% block="servo %pin|from %start to %end in %time ms (smooth)"
    export function moveSmooth(pin: AnalogPin, start: number, end: number, time: number): void {

        let steps = Math.abs(end - start)
        if (steps == 0) return

        let direction = start < end ? 1 : -1

        for (let i = 0; i <= steps; i++) {

            let t = i / steps
            let ease = t * t * (3 - 2 * t)

            let angle = start + (end - start) * ease

            pins.servoWritePin(pin, angle)
            basic.pause(time / steps)
        }
    }
    //% blockId=servo_tune
    //% block="set servo %pin by buttons (A=+, B=-, A+B=ok)"
    //% weight=110
    export function tuneServo(pin: AnalogPin): number {

        let angle2 = 90
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

        return angle2
    }
}
