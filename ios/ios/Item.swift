//
//  Item.swift
//  ios
//
//  Created by 齐天乐 on 2025/11/13.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
