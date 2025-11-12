package com.glancy.backend.controller.request;

import com.glancy.backend.dto.TtsRequest;

/** Query bean used by {@link com.glancy.backend.controller.TtsController} GET endpoints. */
public class TtsQueryRequest {

  private String text;
  private String lang;
  private String voice;
  private String format = "mp3";
  private double speed = 1.0d;

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public String getLang() {
    return lang;
  }

  public void setLang(String lang) {
    this.lang = lang;
  }

  public String getVoice() {
    return voice;
  }

  public void setVoice(String voice) {
    this.voice = voice;
  }

  public String getFormat() {
    return format;
  }

  public void setFormat(String format) {
    this.format = format;
  }

  public double getSpeed() {
    return speed;
  }

  public void setSpeed(double speed) {
    this.speed = speed;
  }

  public TtsRequest toDto() {
    TtsRequest request = new TtsRequest();
    request.setText(text);
    request.setLang(lang);
    request.setVoice(voice);
    request.setFormat(format);
    request.setSpeed(speed);
    request.setShortcut(false);
    return request;
  }
}
