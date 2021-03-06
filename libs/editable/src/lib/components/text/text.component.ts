import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

/**
 * The possible states of an Editable Component
 */
export type EditableState = 'editing' | 'updating' | 'displaying';

/**
 * A Component that can be edited
 * @param state the state of the editable component: 'editing' | 'updating' | 'displaying'
 */
@Component({
  selector: 'editable-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextComponent implements OnInit {
  /**
   * Controls background color of control
   */
  @Input() @HostBinding('style.background') backgroundColor = `#D0B0DA`;
  /**
   * Controls interactive state of control
   */
  @Input() state: EditableState = 'editing';

  _textValue = '';
  @Input() set textValue(value: string) {
    this._textValue = value;
    if (this.control) {
      this.control.setValue(value);
    }
  }

  @Output() updateText = new EventEmitter<string>();
  @Output() cancelEdit = new EventEmitter();
  @Output() startEdit = new EventEmitter();

  control: FormControl;

  ngOnInit() {
    this.control = new FormControl(
      this._textValue
    );
  }

  initiateUpdateText() {
    const newValue = this.control.value;
    this.updateText.emit(newValue);
  }

  cancelUpdateText() {
    this.cancelEdit.emit();
  }

  enableEditing() {
    this.startEdit.emit();
  }
}
