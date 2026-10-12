package com.ironbro.guild

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { GuildMobileScreen() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GuildMobileScreen() {
    var showAgent by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val timeline = listOf("October Goal", "November Goal", "December Goal")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF030712), Color(0xFF0F172A), Color(0xFF164E63))
                )
            )
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Guild Companion", color = Color.White)
            Text("Parallax timeline + quick assessment", color = Color(0xFFA5F3FC))
            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(timeline) { month ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0x33000000))
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(month, color = Color.White)
                        Button(onClick = { /* TODO: Launch CameraX capture flow */ }) {
                            Text("Capture")
                        }
                    }
                }
            }
        }

        Button(
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
            onClick = { showAgent = true }
        ) {
            Text("Guild Agent")
        }
    }

    if (showAgent) {
        ModalBottomSheet(onDismissRequest = { showAgent = false }, sheetState = sheetState) {
            Text(
                text = "Today's focus is XYZ. You are 2 days behind on Week 2 check-in.",
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}
