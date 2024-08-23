from flask import Blueprint, request, abort, render_template, redirect
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    GroupImage,
    User,
    Memberships,
    Attendances,
    Venue,
    Event,
    EventImage,
)
from app.forms import GroupForm, GroupImageForm

group_routes = Blueprint("groups", __name__)


@group_routes.route("/")
def all_groups():
    """
    Query for all groups and returns them in a list of user dictionaries
    """
    groups = Group.query.all()
    return {"groups": [group.to_dict() for group in groups]}


@group_routes.route("/<int:group_id>")
def group(group_id):
    """
    Query for group by id and returns that group in a dictionary
    """
    group = Group.query.get(group_id)
    return group.to_dict()


@group_routes.route("/new", methods=["GET", "POST"])
@login_required
def create_group():
    """
    Create a new group linked to the current user and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post works
    """
    form = GroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        new_group = Group(
            organizer_id=current_user.id,
            name=form.data["name"],
            about=form.data["about"],
            type=form.data["type"],
            city=form.data["city"],
            state=form.data["state"],
        )
        db.session.add(new_group)
        db.session.commit()
        #   return redirect("/api/groups/")
        return new_group.to_dict()
    #     if form.errors:
    #           print(form.errors)
    #           return render_template("group_form.html", form=form, errors=form.errors)
    #     return render_template("group_form.html", form=form, errors=None)
    return form.errors, 400


@group_routes.route("/<int:group_id>/edit", methods=["GET", "POST"])
@login_required
def edit_group(group_id):
    """
    will generate an update group form on get requests and validate/save on post requests
    """
    group_to_edit = Group.query.get(group_id)

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id is not group_to_edit.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = GroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        group_to_edit.organizer_id = current_user.id
        group_to_edit.name = form.data["name"]
        group_to_edit.about = form.data["about"]
        group_to_edit.type = form.data["type"]
        group_to_edit.city=form.data["city"]
        group_to_edit.state=form.data["state"]
        db.session.commit()
        return redirect(f"/api/groups/{group_id}")

    elif form.errors:
        print(form.errors)
        return render_template(
            "group_form.html", form=form, type="update", id=group_id, errors=form.errors
        )

    else:
        current_data = Group.query.get(group_id)
        print(current_data)
        form.process(obj=current_data)
        return render_template(
            "group_form.html", form=form, type="update", id=group_id, errors=None
        )


@group_routes.route("delete/<int:group_id>", methods=["GET", "POST"])
@login_required