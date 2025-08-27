package com.glancy.backend.service;

import org.springframework.stereotype.Service;

/** Simple service for aspect testing. */
@Service
public class EchoService {
  public String echo(String name) {
    return "echo: " + name;
  }
}

