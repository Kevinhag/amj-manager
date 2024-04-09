#include "HX711.h"
#include <ESP32Servo.h>
#include <Stepper.h>

const int steps = 1000;

Servo servoDisp, servoLid1, servoLid2;
HX711 scale;
Stepper sMotor(steps, 7, 8, 9, 10 );

const byte trigPin = 2, echoPin = 15, lidTrigPin = 0, lidEchoPin = 4;
const byte servoDispPin = 5, servoLid1Pin = 17, servoLid2Pin = 16;
const byte dtPin =  19, sckPin = 18;
const float calibration_factor = 4.2;
const int ledCount = 10;
const byte ledAlert = 21;
int servoPos = 0;
int servoLidPos = 0;
int servoLid2Pos = 180;
bool full = false;
bool tOut = false;


// Porta > 34 só pode ser usada como INPUT
const byte ledPins[] = {
  13, 12, 14, 27, 26, 25, 33, 32, 22, 23
};



void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(lidTrigPin, OUTPUT);
  pinMode(lidEchoPin, INPUT);
  pinMode(ledAlert, OUTPUT);

  for (int thisLed = 0; thisLed < ledCount; thisLed++) {
    pinMode(ledPins[thisLed], OUTPUT);
  }
  sMotor.setSpeed(60);
  servoDisp.setPeriodHertz(50);
  servoDisp.attach(servoDispPin);
  servoLid1.attach(servoLid1Pin);
  servoLid2.attach(servoLid2Pin);
  scale.begin(dtPin, sckPin);
  scale.set_scale(calibration_factor);
  servoLid2.write(180);
}

float distanceSensor(byte trig, byte echo) {
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  int duration = pulseIn(echo, HIGH);
  float dist = duration / 58.88;
  Serial.println(dist);
  return dist;
}

void scaleReset(byte DT, byte SCK) {
  digitalWrite(DT, LOW);
  digitalWrite(SCK, LOW);
  delay(100);
  scale.begin(DT, SCK);
}

void loop() {
  float scaleRead = scale.get_units(1);
  float weight = scaleRead / 100;
  int ledLevel = map(scaleRead, 0, 500, 0, ledCount);

  // Inicia uma nova medição:
  Serial.print("Volume interno: ");
  float intDist = distanceSensor(trigPin, echoPin);
  Serial.print("Tampa: ");
  float lidDist = distanceSensor(lidTrigPin, lidEchoPin);


  for (int thisLed = 0; thisLed < ledCount; thisLed++) {
    if (thisLed < ledLevel) {
      digitalWrite(ledPins[thisLed], HIGH);
    }
    else {
      digitalWrite(ledPins[thisLed], LOW);
    }
  }
  
  if (weight > 4.5 || intDist < 10) {
    Serial.println("CHEIO");
    full = true;
    servoPos = 180;
    
    while (full == true) {
      sMotor.step(steps);
      delay(1000);
      sMotor.step(-steps);
      delay(300);
      full = false;
      digitalWrite(ledAlert, HIGH);
      scaleReset(dtPin, sckPin);
    }
    
  } else {
    servoPos = 0;
  }

  if (lidDist < 30) {
    Serial.println("Tampa Aberta");
    servoLidPos = 0;
    servoLid2Pos = 180;
  } else {
    Serial.println("Tampa Fechada");
    servoLidPos = 180;
    servoLid2Pos = 0;
  }
  
  servoLid1.write(servoLidPos);
  servoLid2.write(servoLid2Pos);
  servoDisp.write(servoPos);
  Serial.print("Peso atual: ");
  Serial.println(weight);
  delay(500);
}
