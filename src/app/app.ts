import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { TextInput } from './ui/text-input';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    TextInput,
  ],
  templateUrl: './app.html',
})
export class App {}
