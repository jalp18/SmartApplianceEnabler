import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import {FormArray, FormGroup, Validators} from '@angular/forms';
import {FormHandler} from '../../shared/form-handler';
import {ErrorMessages} from '../../shared/error-messages';
import {ErrorMessageHandler} from '../../shared/error-message-handler';
import {HttpRead} from './http-read';
import {Logger} from '../../log/logger';
import {TranslateService} from '@ngx-translate/core';
import {InputValidatorPatterns} from '../../shared/input-validator-patterns';
import {getValidString} from '../../shared/form-util';
import {ERROR_INPUT_REQUIRED, ErrorMessage, ValidatorType} from '../../shared/error-message';
import {HttpReadValueComponent} from '../read-value/http-read-value.component';
import {HttpReadValue} from '../read-value/http-read-value';
import {ValueNameChangedEvent} from '../../meter/value-name-changed-event';

export interface NameChangedEvent {
  r
}

@Component({
  selector: 'app-http-read',
  templateUrl: './http-read.component.html',
  styleUrls: ['./http-read.component.scss'],
})
export class HttpReadComponent implements OnChanges, OnInit {
  @Input()
  httpRead: HttpRead;
  @ViewChildren('httpReadValues')
  httpReadValueComps: QueryList<HttpReadValueComponent>;
  @Input()
  valueNames: string[];
  @Input()
  maxValues: number;
  @Input()
  contentProtocol: string;
  @Input()
  disableFactorToValue = false;
  @Input()
  disableRemove = false;
  @Input()
  form: FormGroup;
  formHandler: FormHandler;
  @Input()
  translationPrefix: string;
  @Input()
  translationKeys: string[];
  translatedStrings: string[];
  @Output()
  remove = new EventEmitter<any>();
  @Output()
  nameChanged = new EventEmitter<any>();
  errors: { [key: string]: string } = {};
  errorMessages: ErrorMessages;
  errorMessageHandler: ErrorMessageHandler;

  constructor(private logger: Logger,
              private translate: TranslateService,
              private changeDetectorRef: ChangeDetectorRef
  ) {
    this.errorMessageHandler = new ErrorMessageHandler(logger);
    this.formHandler = new FormHandler();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.httpRead) {
      if (changes.httpRead.currentValue) {
        this.httpRead = changes.httpRead.currentValue;
      } else {
        this.httpRead = HttpRead.createWithSingleChild();
      }
      this.updateForm();
    }
    if (changes.form) {
      this.expandParentForm();
    }
  }

  ngOnInit() {
    this.errorMessages = new ErrorMessages('HttpReadComponent.error.', [
      new ErrorMessage('url', ValidatorType.required, ERROR_INPUT_REQUIRED, true),
      new ErrorMessage('url', ValidatorType.pattern),
    ], this.translate);
    this.form.statusChanges.subscribe(() => {
      this.errors = this.errorMessageHandler.applyErrorMessages(this.form, this.errorMessages);
    });
    this.translate.get(this.translationKeys).subscribe(translatedStrings => {
      this.translatedStrings = translatedStrings;
    });
  }

  onNameChanged(index: number, event: ValueNameChangedEvent) {
    event.valueIndex = index;
    this.nameChanged.emit(event);
  }

  get isRemoveHttpReadPossible() {
    return !this.disableRemove;
  }

  removeHttpRead() {
    this.remove.emit();
  }

  get isAddValuePossible() {
    return !this.httpRead.readValues || !this.maxValues || this.httpRead.readValues.length < this.maxValues;
  }

  addValue() {
    const newReadValue = new HttpReadValue();
    if (!this.httpRead.readValues) {
      this.httpRead.readValues = [];
    }
    this.httpRead.readValues.push(newReadValue);
    this.httpReadValuesFormArray.push(new FormGroup({}));
    this.form.markAsDirty();
    this.changeDetectorRef.detectChanges();
  }

  get isRemoveValuePossible() {
    return !this.maxValues || this.maxValues > 1;
  }

  removeHttpReadValue(index: number) {
    this.httpRead.readValues.splice(index, 1);
    this.httpReadValuesFormArray.removeAt(index);

    const event: ValueNameChangedEvent = {valueIndex: index};
    this.nameChanged.emit(event);

    this.form.markAsDirty();
  }

  get httpReadValuesFormArray() {
    return this.form.controls.httpReadValues as FormArray;
  }

  getHttpReadValueFormGroup(index: number) {
    return this.httpReadValuesFormArray.controls[index];
  }

  expandParentForm() {
    this.formHandler.addFormControl(this.form, 'url', this.httpRead.url,
      [Validators.required, Validators.pattern(InputValidatorPatterns.URL)]);
    this.formHandler.addFormArrayControlWithEmptyFormGroups(this.form, 'httpReadValues',
      this.httpRead.readValues);
  }

  updateForm() {
    this.formHandler.setFormControlValue(this.form, 'url', this.httpRead.url);
    this.formHandler.setFormArrayControlWithEmptyFormGroups(this.form, 'httpReadValues',
      this.httpRead.readValues);
  }

  updateModelFromForm(): HttpRead | undefined {
    const url = getValidString(this.form.controls.url.value);
    const httpReadValues = [];
    this.httpReadValueComps.forEach(httpReadValueComp => {
      const httpReadValue = httpReadValueComp.updateModelFromForm();
      if (httpReadValue) {
        httpReadValues.push(httpReadValue);
      }
    });

    if (!(url || httpReadValues.length > 0)) {
      return undefined;
    }

    this.httpRead.url = url;
    return this.httpRead;
  }
}
